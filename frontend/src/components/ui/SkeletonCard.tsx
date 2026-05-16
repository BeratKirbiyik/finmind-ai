"use client";

export function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="bg-[#16161f] border border-[#ffffff0f] rounded-2xl p-5 space-y-3 animate-fade-up-stagger"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="h-2.5 w-20 rounded-full shimmer" />
      <div className="h-7 w-32 rounded-lg shimmer" />
      <div className="h-2.5 w-24 rounded-full shimmer" style={{ opacity: 0.7 }} />
    </div>
  );
}

export function SkeletonChart({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="bg-[#16161f] border border-[#ffffff0f] rounded-2xl p-5 space-y-4 animate-fade-up-stagger"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="h-2.5 w-28 rounded-full shimmer" />
      <div className="h-44 w-full rounded-xl shimmer" />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => (
          <SkeletonCard key={i} delay={i * 60} />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <SkeletonChart delay={240} />
        <SkeletonChart delay={300} />
      </div>
    </div>
  );
}
