import { useEffect, useRef } from 'react';
import { useChat } from '@/lib/chat-store';
import MessageList from '@/components/chat/MessageList';
import Composer from '@/components/chat/Composer';
import Welcome from '@/components/chat/Welcome';

const MODE_META = {
  chat: { title: 'New chat', subtitle: 'Ask anything' },
  code: { title: 'Code Assistant', subtitle: 'Read, write and debug code' },
};

export default function ChatPane({ mode = 'chat' }) {
  const { setMode, messages, sending, error, sendMessage, retry, activeConversation, loadingMessages } = useChat();
  const scrollRef = useRef(null);

  useEffect(() => {
    setMode(mode);
  }, [mode, setMode]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages.length, sending, error]);

  const meta = MODE_META[mode] ?? MODE_META.chat;
  const hasMessages = messages.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="hidden h-14 shrink-0 items-center justify-between gap-3 border-b border-white/[0.05] px-6 md:flex">
        <div className="min-w-0">
          <h2 className="truncate font-heading text-[13px] font-semibold tracking-tight text-white/85">
            {activeConversation?.title ?? meta.title}
          </h2>
          <p className="truncate text-[11px] text-white/30">{meta.subtitle}</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-[9.5px] font-medium uppercase tracking-[0.16em] text-white/40">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          Live AI
        </span>
      </header>

      <div ref={scrollRef} className="scrollbar-slim min-h-0 flex-1 overflow-y-auto">
        {loadingMessages ? (
          <div className="mx-auto max-w-3xl space-y-4 px-6 py-10">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-4 w-2/3 animate-pulse rounded bg-white/[0.05]" />
            ))}
          </div>
        ) : hasMessages ? (
          <MessageList messages={messages} sending={sending} error={error} onRetry={error?.retry ?? retry} />
        ) : (
          <Welcome mode={mode} onSelect={(prompt) => sendMessage({ text: prompt })} />
        )}
      </div>

      <div className="shrink-0 px-3 pb-4 pt-1 md:px-6 md:pb-6">
        <div className="mx-auto w-full max-w-3xl">
          <Composer busy={sending} onSend={(text, attachments) => sendMessage({ text, attachments })} />
          <p className="mt-2.5 text-center text-[10.5px] text-white/20">
            Vnex AI can make mistakes. Check important information.
          </p>
        </div>
      </div>
    </div>
  );
}