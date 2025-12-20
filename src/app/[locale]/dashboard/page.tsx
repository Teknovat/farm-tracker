"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth/context";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { LogoutButton } from "@/components/auth/LogoutButton";

function DashboardContent() {
  const t = useTranslations("dashboard");
  const { user, farm } = useAuth();
  const router = useRouter();

  // Redirect to onboarding if user doesn't have a farm
  useEffect(() => {
    if (user && !farm) {
      router.push("/onboarding");
    }
  }, [user, farm, router]);

  // Show loading if no farm (will redirect)
  if (!farm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <MobileLayout
      title={t("title")}
      actions={
        <div className="flex items-center space-x-2">
          <LanguageSelector />
          <LogoutButton />
        </div>
      }
    >
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-gray-600">
            {t("welcome")}, {user?.name}!
          </p>
          {farm && (
            <p className="text-sm text-gray-500 mt-1">
              {farm.name} ({farm.role})
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900">{t("totalAnimals")}</h3>
            <p className="text-2xl font-bold text-blue-600">0</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-900">{t("cashboxBalance")}</h3>
            <p className="text-2xl font-bold text-green-600">0 TND</p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium text-yellow-900">{t("birthsThisMonth")}</h3>
            <p className="text-2xl font-bold text-yellow-600">0</p>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-medium text-red-900">{t("deathsThisMonth")}</h3>
            <p className="text-2xl font-bold text-red-600">0</p>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
