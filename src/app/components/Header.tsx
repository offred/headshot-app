import { Logo } from "./Logo";
import { SlidingImages } from "./SlidingImages";

export function Header() {
  return (
    <header className="mb-16 overflow-hidden">
      {/* Nav bar */}
      <nav className="flex items-center justify-between mb-20 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <Logo
            className="h-8 w-auto text-accent"
            style={{
              filter: "drop-shadow(0 0 12px var(--color-accent-glow-strong))",
            }}
          />
          <div
            className="h-5 w-px"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
          />
          <a
            href="https://tellydraft.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium tracking-wide text-secondary hover:text-primary transition-colors rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            TellyDraft.com
          </a>
        </div>
        <div
          className="flex items-center gap-2 py-1.5 px-3 rounded-full"
          style={{
            backgroundColor: "rgba(224, 90, 122, 0.08)",
            border: "1px solid rgba(224, 90, 122, 0.2)",
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full bg-accent"
            style={{
              boxShadow: "0 0 6px var(--color-accent-glow-strong)",
            }}
          />
          <span
            className="font-mono text-[10px] tracking-widest uppercase text-accent-dim"
          >
            Production Tool
          </span>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative animate-fade-in-up" style={{ animationDelay: "0.08s" }}>
        {/* Accent glow behind title */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-75 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(224, 90, 122, 0.06) 0%, transparent 70%)",
          }}
        />

        <div className="relative text-center max-w-3xl mx-auto">
          <h1
            className="font-display text-6xl md:text-8xl tracking-tight leading-[0.9] mb-5 text-primary"
          >
            Headshot
            <br />
            <span className="text-accent">Processor</span>
          </h1>
          <p
            className="text-sm md:text-base max-w-md mx-auto leading-relaxed text-secondary"
          >
            Upload cast photos, auto-crop faces &amp; strip backgrounds.
            Download production-ready transparent PNGs.
          </p>
        </div>
      </div>

      {/* Sliding showcase */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        <SlidingImages />
      </div>
    </header>
  );
}
