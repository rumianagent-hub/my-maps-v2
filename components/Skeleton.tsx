"use client";

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-lg ${className}`} />;
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`shimmer rounded-lg h-4 ${i === lines - 1 ? "w-3/4" : "w-full"}`} />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = { sm: "w-8 h-8", md: "w-11 h-11", lg: "w-20 h-20" };
  return <div className={`shimmer rounded-xl ${sizeClasses[size]} ${className}`} />;
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-[var(--bg-card)] rounded-2xl overflow-hidden border border-white/[0.06] ${className}`}>
      <div className="shimmer aspect-[4/3] w-full" />
      <div className="p-4 space-y-3">
        <div className="shimmer h-5 w-3/4 rounded-lg" />
        <div className="shimmer h-4 w-1/2 rounded-lg" />
        <div className="shimmer h-4 w-full rounded-lg" />
        <div className="flex gap-2 mt-2">
          <div className="shimmer h-6 w-16 rounded-full" />
          <div className="shimmer h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonPostList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonPostGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonUserRow() {
  return (
    <div className="flex items-center gap-3 p-3.5 bg-white/[0.03] rounded-xl border border-white/[0.04]">
      <SkeletonAvatar />
      <div className="flex-1 space-y-2">
        <div className="shimmer h-4 w-32 rounded-lg" />
        <div className="shimmer h-3 w-20 rounded-lg" />
      </div>
      <div className="shimmer h-4 w-16 rounded-lg" />
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-24 pb-8">
      <div className="flex items-start gap-5 mb-8">
        <SkeletonAvatar size="lg" />
        <div className="flex-1 space-y-3">
          <div className="shimmer h-6 w-40 rounded-lg" />
          <div className="shimmer h-4 w-24 rounded-lg" />
          <div className="shimmer h-4 w-64 rounded-lg" />
          <div className="flex gap-5">
            <div className="shimmer h-4 w-16 rounded-lg" />
            <div className="shimmer h-4 w-20 rounded-lg" />
            <div className="shimmer h-4 w-20 rounded-lg" />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="shimmer h-48 rounded-2xl" />)}
      </div>
    </div>
  );
}
