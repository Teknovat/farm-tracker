"use client";

import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useTranslations } from "next-intl";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/context";

function MembersContent() {
  const t = useTranslations("members");
  const { user, farm } = useAuth();

  return (
    <MobileLayout
      title={t("title")}
      actions={
        farm?.role === "OWNER" ? (
          <Button size="sm">{t("inviteMember")}</Button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <Card>
          <div className="flex items-center space-x-4 p-2">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xl">👤</span>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{user?.name}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {farm?.role || "OWNER"}
              </span>
            </div>
          </div>
        </Card>

        {farm?.role !== "OWNER" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">{t("noPermission")}</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

export default function MembersPage() {
  return (
    <ProtectedRoute>
      <MembersContent />
    </ProtectedRoute>
  );
}
