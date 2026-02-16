interface ProcessingSkeletonProps {
  phaseLabel: string;
  fileCount: number;
}

export function ProcessingSkeleton({ phaseLabel, fileCount }: ProcessingSkeletonProps) {
  return (
    <div className="mt-12 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: "var(--accent)",
            boxShadow: "0 0 8px var(--accent-glow-strong)",
            animation: "fade-in 0.8s ease-in-out infinite alternate",
          }}
        />
        <span
          className="font-mono text-xs tracking-wider uppercase"
          style={{ color: "var(--accent-dim)" }}
        >
          {phaseLabel}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: fileCount }, (_, i) => (
          <div
            key={i}
            className="aspect-square rounded-xl animate-shimmer"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
