import { cn } from "@/lib/utils";

type PlanSlug = "starter" | "growth" | "pro" | "enterprise";

const PLAN_CONFIG: Record<PlanSlug, { label: string; className: string }> = {
  starter:    { label: "Starter",    className: "bg-gray-100 text-gray-600 border-gray-200" },
  growth:     { label: "Growth",     className: "bg-blue-100 text-blue-700 border-blue-200" },
  pro:        { label: "Pro",        className: "bg-purple-100 text-purple-700 border-purple-200" },
  enterprise: { label: "Enterprise", className: "bg-amber-100 text-amber-700 border-amber-200" },
};

interface PlanBadgeProps {
  plan: PlanSlug | string;
  className?: string;
}

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  const key = plan.toLowerCase() as PlanSlug;
  const config = PLAN_CONFIG[key] ?? PLAN_CONFIG.starter;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
