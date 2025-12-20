"use client";

import { useAuth } from "@/lib/auth/context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireFarm?: boolean;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, requireFarm = false, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, farm } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store the intended destination
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/login?returnUrl=${returnUrl}`);
    } else if (!isLoading && isAuthenticated && requireFarm && !farm) {
      // Redirect to farm selection or creation if farm is required but not set
      router.push("/farms");
    }
  }, [isAuthenticated, isLoading, farm, requireFarm, router, pathname]);

  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t("loading")}</p>
          </div>
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (requireFarm && !farm) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
