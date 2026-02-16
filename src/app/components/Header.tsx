import { Logo } from "./Logo";
import { SlidingImages } from "./SlidingImages";

export function Header() {
  return (
    <header className="mb-16 overflow-hidden">
      {/* Nav bar */}
      <nav className="flex items-center justify-between mb-20 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <Logo
            className="h-8 w-auto"
            style={{
              color: "var(--accent)",
              filter: "drop-shadow(0 0 12px var(--accent-glow-strong))",
            }}
          />
          <div
            className="h-5 w-px"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
          />
          <span
            className="text-sm font-medium tracking-wide"
            style={{ color: "var(--text-secondary)" }}
          >
            TellyDraft.com
          </span>
        </div>
        <div
          className="flex items-center gap-2 py-1.5 px-3 rounded-full"
          style={{
            backgroundColor: "rgba(224, 90, 122, 0.08)",
            border: "1px solid rgba(224, 90, 122, 0.2)",
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: "var(--accent)",
              boxShadow: "0 0 6px var(--accent-glow-strong)",
            }}
          />
          <span
            className="font-mono text-[10px] tracking-widest uppercase"
            style={{ color: "var(--accent-dim)" }}
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
            className="font-display text-7xl sm:text-8xl tracking-tight leading-[0.9] mb-5"
            style={{ color: "var(--text)" }}
          >
            Headshot
            <br />
            <span style={{ color: "var(--accent)" }}>Processor</span>
          </h1>
          <p
            className="text-base max-w-md mx-auto leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Upload cast photos, auto-crop faces &amp; strip backgrounds.
            <br />
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
