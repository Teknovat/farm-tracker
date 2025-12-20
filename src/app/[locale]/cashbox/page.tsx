"use client";

import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useTranslations } from "next-intl";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Link from "next/link";

function CashboxContent() {
  const t = useTranslations("cashbox");

  return (
    <MobileLayout title={t("title")}>
      <div className="space-y-4">
        <Card>
          <div className="text-center py-6">
            <div className="text-sm text-gray-500 mb-2">{t("balance")}</div>
            <div className="text-3xl font-bold text-gray-900">0 TND</div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/cashbox/deposit">
            <Button fullWidth variant="primary" className="bg-green-600 hover:bg-green-700">
              {t("addDeposit")}
            </Button>
          </Link>
          <Link href="/cashbox/expense">
            <Button fullWidth variant="secondary">
              {t("addExpense")}
            </Button>
          </Link>
        </div>

        <Card>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t("noMovements")}</h3>
            <p className="text-gray-600">No transactions recorded yet.</p>
          </div>
        </Card>
      </div>
    </MobileLayout>
  );
}

export default function CashboxPage() {
  return (
    <ProtectedRoute>
      <CashboxContent />
    </ProtectedRoute>
  );
}
