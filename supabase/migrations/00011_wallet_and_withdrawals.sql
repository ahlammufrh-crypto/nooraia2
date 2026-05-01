-- Create withdrawals status enum
CREATE TYPE withdrawal_status AS ENUM ('pending', 'approved', 'rejected');

-- Create wallets table
CREATE TABLE public.wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create withdrawals table
CREATE TABLE public.withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    bank_name TEXT NOT NULL,
    iban TEXT NOT NULL,
    account_name TEXT NOT NULL,
    status withdrawal_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);

-- RLS for Withdrawals
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);
-- Note: Insert is handled by secure RPC below to prevent unauthorized balance manipulation.

-- RPC Function: Increment Wallet Balance (used for crediting earnings)
CREATE OR REPLACE FUNCTION increment_wallet_balance(p_user_id UUID, p_amount DECIMAL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create wallet if it doesn't exist, otherwise increment balance
    INSERT INTO public.wallets (user_id, balance)
    VALUES (p_user_id, p_amount)
    ON CONFLICT (user_id) 
    DO UPDATE SET balance = public.wallets.balance + EXCLUDED.balance, updated_at = NOW();
END;
$$;

-- RPC Function: Process Withdrawal (handles atomic check, deduction, and creation)
CREATE OR REPLACE FUNCTION process_withdrawal(
    p_user_id UUID, 
    p_amount DECIMAL, 
    p_bank_name TEXT, 
    p_iban TEXT, 
    p_account_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance DECIMAL;
    new_withdrawal_id UUID;
BEGIN
    -- Lock the wallet row for update
    SELECT balance INTO current_balance
    FROM public.wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Wallet not found.');
    END IF;

    IF current_balance < p_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient funds.');
    END IF;

    -- Deduct funds
    UPDATE public.wallets 
    SET balance = balance - p_amount, updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Insert withdrawal request
    INSERT INTO public.withdrawals (user_id, amount, bank_name, iban, account_name)
    VALUES (p_user_id, p_amount, p_bank_name, p_iban, p_account_name)
    RETURNING id INTO new_withdrawal_id;

    RETURN json_build_object('success', true, 'withdrawal_id', new_withdrawal_id);
END;
$$;
