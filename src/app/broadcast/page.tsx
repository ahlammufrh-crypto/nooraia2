import { Video, Users, PlayCircle, Settings, MessageSquare } from "lucide-react";

export default function Broadcast() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Video className="text-primary-glow" /> البث المباشر
          </h1>
          <p className="text-zinc-400 text-sm">شارك شاشتك وألعابك السحابية مع أصدقائك بضغطة زر</p>
        </div>
        <button className="px-6 py-3 bg-primary hover:bg-primary-glow text-zinc-950 rounded-xl font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)]">
          <PlayCircle className="w-5 h-5" /> بدء البث
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 flex flex-col gap-6">
          {/* Video Player Placeholder */}
          <div className="glass-panel rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center border border-zinc-800 bg-zinc-950/80">
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                مباشر
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-800/80 text-white flex items-center gap-1.5 backdrop-blur-md">
                <Users className="w-3.5 h-3.5" /> 1,204
              </span>
            </div>
            
            <div className="text-center">
              <Video className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-500 font-medium">أنت لست على الهواء حالياً</p>
            </div>
          </div>

          {/* Stream Settings */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row gap-8 justify-between items-center">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-zinc-400 mb-2">عنوان البث</label>
              <input type="text" defaultValue="تجربة أداء Cyberpunk 2077 على RTX 4090 🔥" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary" />
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <div className="flex-1 md:flex-none">
                <label className="block text-sm font-medium text-zinc-400 mb-2">الدقة</label>
                <select className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary">
                  <option>1080p 60fps</option>
                  <option>1440p 60fps</option>
                  <option>4K 60fps</option>
                </select>
              </div>
              <button className="self-end p-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all h-[46px] mt-7">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Chat */}
        <div className="w-full lg:w-80 glass-panel rounded-2xl flex flex-col h-[calc(100vh-12rem)] min-h-[500px]">
          <div className="p-4 border-b border-zinc-800/50 flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> المحادثة المباشرة
            </h3>
            <Users className="w-4 h-4 text-zinc-500" />
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
            <div className="text-sm">
              <span className="font-bold text-accent">Gamer123: </span>
              <span className="text-zinc-300">متى بتبدأ؟</span>
            </div>
            <div className="text-sm">
              <span className="font-bold text-primary">Ali_K: </span>
              <span className="text-zinc-300">منتظرين الأداء الخرافي 🚀</span>
            </div>
            <div className="text-sm">
              <span className="font-bold text-green-400">ProSniper: </span>
              <span className="text-zinc-300">كيف الحرارة مع 4K؟</span>
            </div>
          </div>

          <div className="p-4 border-t border-zinc-800/50">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl flex items-center p-1 pr-4">
              <input type="text" placeholder="أرسل رسالة..." className="flex-1 bg-transparent text-sm text-white focus:outline-none" />
              <button className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all ml-1">
                إرسال
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
