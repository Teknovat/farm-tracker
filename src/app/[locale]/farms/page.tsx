"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth/context";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { Button } from "@/components/ui/Button";

function FarmsContent() {
  const t = useTranslations("dashboard");
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Select Farm</h1>
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
              <p className="text-sm text-gray-500 mt-1">You need to select a farm or create a new one to continue.</p>
            </div>

            <div className="space-y-3">
              <Button fullWidth variant="primary">
                Create New Farm
              </Button>

              <div className="text-center text-sm text-gray-500">or join an existing farm with an invitation</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FarmsPage() {
  return (
    <ProtectedRoute requireFarm={false}>
      <FarmsContent />
    </ProtectedRoute>
  );
}
