import { useState } from 'react';
import { MessageSquare, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useChat } from '@/lib/chat-store';
import { cn } from '@/lib/utils';

export default function ConversationList({ onNavigate }) {
  const { conversations, activeId, openConversation, renameConversation, deleteConversation, search, sample, loadingConversations } =
    useChat();
  const [menuId, setMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');

  const commitRename = (id, value) => {
    const title = (value ?? draft).trim();
    setEditingId(null);
    if (title) renameConversation(id, title);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-3 pb-2 pt-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
          {search.trim() ? 'Results' : 'Recent'}
        </span>
        {sample && (
          <span className="rounded border border-white/10 px-1.5 py-[1px] text-[9px] uppercase tracking-[0.12em] text-white/30">
            Sample
          </span>
        )}
      </div>

      <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {loadingConversations && (
          <div className="space-y-2 px-2 py-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded-lg bg-white/[0.04]" />
            ))}
          </div>
        )}

        {!loadingConversations && conversations.length === 0 && (
          <p className="px-2 py-6 text-center text-[12px] leading-relaxed text-white/30">
            {search.trim() ? 'No conversations match that search.' : 'Your conversations will appear here.'}
          </p>
        )}

        {conversations.map((c) => (
          <div
            key={c.id}
            className={cn(
              'group relative flex items-center gap-2 rounded-lg px-2 py-[7px] text-[13px] transition-colors',
              activeId === c.id ? 'bg-white/[0.07] text-white' : 'text-white/55 hover:bg-white/[0.04] hover:text-white/90'
            )}
          >
            <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-50" />

            {editingId === c.id ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={(e) => commitRename(c.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename(c.id, e.currentTarget.value);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="min-w-0 flex-1 rounded border border-white/15 bg-black/40 px-1.5 py-0.5 text-[13px] text-white focus:border-[#8b7cff]/60 focus:outline-none"
              />
            ) : (
              <button
                onClick={() => {
                  openConversation(c.id);
                  onNavigate?.();
                }}
                className="min-w-0 flex-1 truncate text-left"
                title={c.title}
              >
                {c.title}
              </button>
            )}

            <button
              onClick={() => setMenuId(menuId === c.id ? null : c.id)}
              aria-label="Conversation options"
              className={cn(
                'grid h-6 w-6 shrink-0 place-items-center rounded-md text-white/50 transition hover:bg-white/10 hover:text-white',
                menuId === c.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
              )}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>

            {menuId === c.id && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuId(null)} />
                <div className="absolute right-1 top-8 z-50 w-36 overflow-hidden rounded-lg border border-white/10 bg-[#15151a] p-1 shadow-2xl">
                  <button
                    onClick={() => {
                      setDraft(c.title);
                      setEditingId(c.id);
                      setMenuId(null);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] text-white/80 transition hover:bg-white/[0.07] hover:text-white"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Rename
                  </button>
                  <button
                    onClick={() => {
                      setMenuId(null);
                      deleteConversation(c.id);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] text-red-300/90 transition hover:bg-red-500/10 hover:text-red-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}