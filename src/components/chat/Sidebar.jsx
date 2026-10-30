import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { AlertCircle, Check, Copy, RefreshCw } from 'lucide-react';
import Logo from '@/components/brand/Logo';
import { cn } from '@/lib/utils';

const MARKDOWN_COMPONENTS = {
  p: ({ children }) => <p className="mb-3 last:mb-0 leading-[1.7]">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1.5 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1.5 pl-5">{children}</ol>,
  li: ({ children }) => <li className="leading-[1.65]">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic text-white/90">{children}</em>,
  h1: ({ children }) => <h3 className="mb-2 mt-4 font-heading text-[15px] font-semibold text-white first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-2 mt-4 font-heading text-[14.5px] font-semibold text-white first:mt-0">{children}</h3>,
  h3: ({ children }) => <h3 className="mb-2 mt-4 font-heading text-[13.5px] font-semibold text-white first:mt-0">{children}</h3>,
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-white/15 pl-3 text-white/60">{children}</blockquote>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-[#a99bff] underline decoration-[#a99bff]/30 underline-offset-2 hover:decoration-[#a99bff]">
      {children}
    </a>
  ),
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-xl border border-white/10 bg-black/50 p-3 text-[12.5px] leading-relaxed">
      {children}
    </pre>
  ),
  code: ({ className, children }) => <code className={cn('font-mono text-[0.88em]', className)}>{children}</code>,
  hr: () => <hr className="my-4 border-white/10" />,
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
      aria-label="Copy response"
      className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-white/30 transition hover:bg-white/5 hover:text-white/70"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function Attachments({ items }) {
  if (!items?.length) return null;
  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {items.map((a, i) =>
        a.type?.startsWith('image/') || a.kind === 'image' ? (
          <img key={i} src={a.url} alt={a.name || 'Attachment'} className="h-24 w-24 rounded-lg border border-white/10 object-cover" />
        ) : (
          <span key={i} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11.5px] text-white/60">
            {a.name || 'File'}
          </span>
        )
      )}
    </div>
  );
}

function Typing() {
  return (
    <div className="flex items-center gap-3">
      <Logo className="h-7 w-7" />
      <div className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-2">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/45 [animation-delay:-0.32s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/45 [animation-delay:-0.16s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/45" />
      </div>
    </div>
  );
}

export default function MessageList({ messages, sending, error, onRetry }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-10">
      <div className="space-y-7">
        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md border border-white/[0.08] bg-white/[0.055] px-4 py-3 text-[13.5px] leading-[1.65] text-white/90">
                <Attachments items={m.attachments} />
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
              </div>
            </div>
          ) : (
            <div key={m.id} className="group flex gap-3">
              <Logo className="mt-0.5 h-7 w-7" />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/30">Vnex AI</span>
                  <span className="opacity-0 transition group-hover:opacity-100">
                    <CopyButton text={m.content} />
                  </span>
                </div>
                <div className="text-[13.5px] text-white/80">
                  <ReactMarkdown components={MARKDOWN_COMPONENTS}>{m.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          )
        )}

        {sending && <Typing />}

        {error && !sending && (
          <div className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-500/[0.06] p-3.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium text-red-100">The assistant could not reply</p>
              <p className="mt-1 text-[12px] leading-relaxed text-red-100/60">{error.message}</p>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11.5px] text-white/80 transition hover:bg-white/5"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}