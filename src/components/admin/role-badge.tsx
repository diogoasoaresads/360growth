import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/db/schema";

const ROLE_CONFIG: Record<UserRole, { label: string; className: string }> = {
  SUPER_ADMIN:    { label: "Super Admin",       className: "bg-violet-100 text-violet-700 border-violet-200" },
  AGENCY_ADMIN:   { label: "Admin da Agência",  className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  AGENCY_MEMBER:  { label: "Membro",            className: "bg-sky-100 text-sky-700 border-sky-200" },
  CLIENT:         { label: "Cliente",           className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role];
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
