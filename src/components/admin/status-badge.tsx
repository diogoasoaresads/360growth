import { cn } from "@/lib/utils";

type Status = "active" | "inactive" | "suspended" | "trial" | "cancelled" | "deleted" | "blocked" | "past_due";

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  active:    { label: "Ativo",        className: "bg-green-100 text-green-700 border-green-200" },
  trial:     { label: "Trial",        className: "bg-blue-100 text-blue-700 border-blue-200" },
  suspended: { label: "Suspenso",     className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  inactive:  { label: "Inativo",      className: "bg-gray-100 text-gray-600 border-gray-200" },
  cancelled: { label: "Cancelado",    className: "bg-red-100 text-red-700 border-red-200" },
  deleted:   { label: "Deletado",     className: "bg-red-200 text-red-900 border-red-300" },
  blocked:   { label: "Bloqueado",    className: "bg-red-100 text-red-700 border-red-200" },
  past_due:  { label: "Inadimplente", className: "bg-orange-100 text-orange-700 border-orange-200" },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive;
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
