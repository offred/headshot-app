interface ErrorBannerProps {
  error: string;
}

export function ErrorBanner({ error }: ErrorBannerProps) {
  return (
    <div
      className="mt-6 p-4 rounded-xl border animate-fade-in"
      style={{
        backgroundColor: "rgba(196, 92, 74, 0.08)",
        borderColor: "rgba(196, 92, 74, 0.3)",
      }}
    >
      <p className="text-sm" style={{ color: "var(--red)" }}>
        {error}
      </p>
    </div>
  );
}
