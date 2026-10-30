import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { ChatProvider } from '@/lib/chat-store';
import Sidebar from '@/components/chat/Sidebar';
import Logo from '@/components/brand/Logo';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ChatProvider>
      <div className="flex h-[100dvh] w-full overflow-hidden bg-background text-foreground">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="app-ambient flex min-w-0 flex-1 flex-col">
          <div className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.05] px-4 md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-white/70 transition hover:bg-white/5 hover:text-white"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <Logo className="h-6 w-6" />
              <span className="font-heading text-[13px] font-semibold tracking-tight text-white">Vnex AI</span>
            </div>
          </div>
          <Outlet />
        </main>
      </div>
    </ChatProvider>
  );
}