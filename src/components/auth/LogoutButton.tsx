"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

interface LogoutButtonProps {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LogoutButton({ variant = "ghost", size = "md", className }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { logout } = useAuth();
  const t = useTranslations("auth");

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleLogout} disabled={isLoading} className={className}>
      {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div> : t("logout")}
    </Button>
  );
}
