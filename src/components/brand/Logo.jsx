export default function Logo({ className = 'h-8 w-8' }) {
  return (
    <span
      className={`relative grid shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-[#a78bfa] via-[#7c6bf7] to-[#4f7cff] shadow-[0_0_20px_-6px_rgba(124,107,247,0.9)] ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[52%] w-[52%]"
        aria-hidden="true"
      >
        <path d="M20.5 11.6a8.1 8.1 0 0 1-8.7 8.1 9.2 9.2 0 0 1-3.6-.8L3.5 20.5l1.5-4.6a8.1 8.1 0 0 1-1-3.9 8.1 8.1 0 0 1 8.2-8.1 8.1 8.1 0 0 1 8.3 7.7z" />
      </svg>
      <span className="absolute -right-[2px] -top-[2px] h-[5px] w-[5px] rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.55)]" />
    </span>
  );
}