"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth/context";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { LanguageSelector } from "@/components/ui/LanguageSelector";

function DashboardContent() {
  const t = useTranslations("dashboard");
  const { user, farm } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
            <div className="flex items-center space-x-2">
              <LanguageSelector />
              <LogoutButton />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-gray-600">
                {t("welcome")}, {user?.name}!
              </p>
              {farm && (
                <p className="text-sm text-gray-500 mt-1">
                  Farm: {farm.name} ({farm.role})
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
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
