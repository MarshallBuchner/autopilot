import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-ap-border-subtle bg-ap-bg text-ap-text-dim">
        <Icon className="h-4.5 w-4.5 h-4 w-4" strokeWidth={1.75} aria-hidden />
      </div>
      <p className="text-sm font-medium text-ap-text">{title}</p>
      <p className="mt-1 max-w-[260px] text-xs leading-relaxed text-ap-text-dim">
        {description}
      </p>
    </div>
  );
}
