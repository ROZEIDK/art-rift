import { Badge } from "@/components/ui/badge";
import { Shield, Code, Star } from "lucide-react";
import { UserRole } from "@/hooks/useUserRole";

interface RoleBadgeProps {
  role: UserRole;
}

export const RoleBadge = ({ role }: RoleBadgeProps) => {
  const roleConfig = {
    admin: {
      label: "Admin",
      icon: Shield,
      variant: "destructive" as const,
    },
    developer: {
      label: "Developer",
      icon: Code,
      variant: "default" as const,
    },
    moderator: {
      label: "Moderator",
      icon: Star,
      variant: "secondary" as const,
    },
  };

  const config = roleConfig[role as keyof typeof roleConfig];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};
