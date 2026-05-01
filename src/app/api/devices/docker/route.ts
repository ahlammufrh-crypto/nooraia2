import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { device_id, base_image = "nvidia/cuda:11.8.0-runtime-ubuntu22.04" } = body;

    if (!device_id) {
      return NextResponse.json({ error: "Missing device_id" }, { status: 400 });
    }

    // Verify ownership
    const { data: device, error: deviceErr } = await supabase
      .from("devices")
      .select("*")
      .eq("id", device_id)
      .eq("lender_id", user.id)
      .single();

    if (deviceErr || !device) {
      return NextResponse.json({ error: "Device not found or not owned by you" }, { status: 404 });
    }

    if (device.type !== "gpu") {
      return NextResponse.json({ error: "Docker orchestration is only for GPU devices" }, { status: 400 });
    }

    // Generate a basic Dockerfile for ML/AI
    const dockerfile = `
FROM ${base_image}
RUN apt-get update && apt-get install -y python3 python3-pip openssh-server sudo
RUN useradd -rm -d /home/ubuntu -s /bin/bash -g root -G sudo -u 1000 ubuntu
RUN echo 'ubuntu:ubuntu' | chpasswd
RUN service ssh start
EXPOSE 22
CMD ["/usr/sbin/sshd","-D"]
    `.trim();

    const dockerConfig = {
      image: base_image,
      dockerfile: dockerfile,
      ports: ["22:22"],
      volumes: ["/data:/data"],
      generated_at: new Date().toISOString()
    };

    // Update the device
    const { error: updateErr } = await supabase
      .from("devices")
      .update({ docker_config: dockerConfig })
      .eq("id", device_id);

    if (updateErr) {
      throw updateErr;
    }

    return NextResponse.json({ success: true, config: dockerConfig });

  } catch (error: any) {
    console.error("[Docker API Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
