import { Lightbulb, PenLine, FileText, Sparkles, Bug, Braces, Wand2, Palette } from 'lucide-react';
import Logo from '@/components/brand/Logo';

const SUGGESTIONS = {
  chat: [
    { icon: Lightbulb, title: 'Explain something simply', prompt: 'Explain how large language models work, in plain English.' },
    { icon: PenLine, title: 'Write launch copy', prompt: 'Write launch copy for a productivity app aimed at freelancers.' },
    { icon: FileText, title: 'Summarise my notes', prompt: 'Summarise these notes into five clear bullet points:' },
    { icon: Sparkles, title: 'Brainstorm ideas', prompt: 'Give me ten unusual ideas for a weekend side project.' },
  ],
  code: [
    { icon: Bug, title: 'Review code for bugs', prompt: 'Review this code for bugs and suggest a cleaner version:\n\n' },
    { icon: Braces, title: 'Write a helper function', prompt: 'Write a TypeScript helper that debounces an async function.' },
    { icon: Sparkles, title: 'Explain an error', prompt: 'Explain this error and how to fix it:\n\n' },
    { icon: Lightbulb, title: 'Refactor for clarity', prompt: 'Refactor this component so it is easier to read:\n\n' },
  ],
};

export default function Welcome({ mode = 'chat', onSelect }) {
  const cards = SUGGESTIONS[mode] ?? SUGGESTIONS.chat;
  const headline = mode === 'code' ? 'What should we build together?' : 'What can I help you with today?';
  const subtitle =
    mode === 'code'
      ? 'Paste code, describe a bug, or ask for a fresh implementation.'
      : 'Vnex AI writes, explains, analyses and plans alongside you.';

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center px-4 py-10 md:py-16">
      <div className="mb-7 flex justify-center">
        <Logo className="h-12 w-12 rounded-2xl" />
      </div>

      <h1 className="text-center font-display text-[2.5rem] leading-[1.05] tracking-[-0.02em] text-white md:text-[3.4rem]">
        {headline}
      </h1>
      <p className="mx-auto mt-4 max-w-md text-center text-[13.5px] leading-relaxed text-white/40">{subtitle}</p>

      <div className="mt-10 grid gap-2.5 sm:grid-cols-2">
        {cards.map((card) => (
          <button
            key={card.title}
            onClick={() => onSelect?.(card.prompt)}
            className="group flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.045]"
          >
            <span className="mt-[1px] grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-white/50 transition group-hover:text-[#a99bff]">
              <card.icon className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-white/85">{card.title}</span>
              <span className="mt-1 line-clamp-2 block text-[11.5px] leading-relaxed text-white/35">{card.prompt}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-center gap-2 text-[10.5px] uppercase tracking-[0.16em] text-white/20">
        <Wand2 className="h-3 w-3" />
        Powered by a secure server-side AI layer
        <Palette className="ml-2 h-3 w-3" />
      </div>
    </div>
  );
}