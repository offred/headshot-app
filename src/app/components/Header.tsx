import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="mb-16 animate-fade-in-up">
      <div className="flex items-center gap-4 mb-8">
        <Logo
          className="h-10 w-auto"
          style={{
            color: "var(--accent)",
            filter: "drop-shadow(0 0 12px var(--accent-glow-strong))",
          }}
        />
        <div
          className="h-8 w-px"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
        />
        <div className="flex flex-col gap-0.5">
          <span
            className="text-md font-bold"
            style={{ color: "var(--text)" }}
          >
            TellyDraft.com
          </span>
        </div>
      </div>
      <h1
        className="font-display text-6xl tracking-tight leading-none mb-3"
        style={{ color: "var(--text)" }}
      >
        Headshot Processor
      </h1>
      <p
        className="text-base max-w-md"
        style={{ color: "var(--text-secondary)" }}
      >
        Upload cast photos, crop &amp; remove backgrounds. Download
        production-ready PNGs.
      </p>
    </header>
  );
}
