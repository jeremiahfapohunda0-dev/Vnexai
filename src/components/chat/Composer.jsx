import { useRef, useState } from 'react';
import { ArrowUp, Paperclip, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_FILES = 4;
const MAX_BYTES = 8 * 1024 * 1024;

export default function Composer({ onSend, busy }) {
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [attachError, setAttachError] = useState(null);
  const textareaRef = useRef(null);
  const fileRef = useRef(null);

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const submit = () => {
    const text = value.trim();
    if ((!text && attachments.length === 0) || busy || uploading) return;
    onSend(text, attachments);
    setValue('');
    setAttachments([]);
    setAttachError(null);
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    });
  };

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList).slice(0, MAX_FILES - attachments.length);
    if (!files.length) return;
    setAttachError(null);
    setUploading(true);
    const uploaded = [];

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          setAttachError('Only images can be attached right now.');
          continue;
        }
        if (file.size > MAX_BYTES) {
          setAttachError('Each image must be smaller than 8 MB.');
          continue;
        }
        // Keep attachments local to this browser session until a backend is configured.
        const localUrl = URL.createObjectURL(file);
        uploaded.push({ url: localUrl, name: file.name, type: file.type, size: file.size, local: true });
      }
      if (uploaded.length) setAttachments((prev) => [...prev, ...uploaded]);
    } catch (e) {
      console.error('Upload failed', e);
      setAttachError('That image could not be attached. Please try again.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="composer-shadow relative rounded-[22px] border border-white/[0.08] bg-[#121216]/90 backdrop-blur-xl transition focus-within:border-white/[0.16]">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-3.5">
          {attachments.map((a, i) => (
            <div key={i} className="relative">
              <img src={a.url} alt={a.name} className="h-14 w-14 rounded-lg border border-white/10 object-cover" />
              <button
                onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label="Remove attachment"
                className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full border border-white/20 bg-[#1c1c22] text-white/70 transition hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {attachError && <p className="px-4 pt-2 text-[11.5px] text-amber-300/80">{attachError}</p>}

      <div className="flex items-end gap-1.5 px-2.5 py-2.5">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading || attachments.length >= MAX_FILES}
          aria-label="Attach an image"
          title="Attach an image"
          className="mb-[3px] grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white/40 transition hover:bg-white/[0.06] hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {uploading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white/80" />
          ) : (
            <Paperclip className="h-[18px] w-[18px]" />
          )}
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          onChange={(e) => {
            setValue(e.target.value);
            resize();
          }}
          placeholder="Message Vnex AI…"
          className="scrollbar-slim max-h-[200px] min-h-[36px] flex-1 resize-none bg-transparent py-[7px] text-[13.5px] leading-[1.6] text-white placeholder:text-white/25 focus:outline-none"
        />

        <button
          onClick={submit}
          disabled={busy || uploading || (!value.trim() && attachments.length === 0)}
          aria-label="Send message"
          className={cn(
            'mb-[1px] grid h-9 w-9 shrink-0 place-items-center rounded-xl transition duration-200',
            busy || uploading || (!value.trim() && attachments.length === 0)
              ? 'bg-white/[0.06] text-white/25'
              : 'bg-gradient-to-br from-[#a78bfa] to-[#5b7cff] text-white shadow-[0_6px_20px_-8px_rgba(139,124,255,0.9)] hover:brightness-110 active:scale-95'
          )}
        >
          {busy ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.4} />
          )}
        </button>
      </div>
    </div>
  );
}