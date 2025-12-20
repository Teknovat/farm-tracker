"use client";

import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useTranslations } from "next-intl";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/context";
import Link from "next/link";

interface CashboxMovement {
  id: string;
  type: "DEPOSIT" | "EXPENSE";
  amount: number;
  description: string;
  category?: string;
  date: string;
}

interface CashboxBalance {
  balance: number;
  totalDeposits: number;
  totalCashExpenses: number;
  totalReimbursements: number;
}

function MovementCard({ movement }: { movement: CashboxMovement }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span>{movement.type === "DEPOSIT" ? "💰" : "💸"}</span>
          <div>
            <p className="font-medium text-gray-900">{movement.description}</p>
            {movement.category && (
              <p className="text-xs text-gray-500">{movement.category}</p>
            )}
            <p className="text-xs text-gray-500">
              {new Date(movement.date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
      <div className={`text-right ${movement.type === "DEPOSIT" ? "text-green-600" : "text-red-600"}`}>
        <p className="font-semibold">
          {movement.type === "DEPOSIT" ? "+" : "-"}{movement.amount} TND
        </p>
      </div>
    </div>
  );
}

function CashboxContent() {
  const [balance, setBalance] = useState<CashboxBalance | null>(null);
  const [movements, setMovements] = useState<CashboxMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { farm } = useAuth();
  const t = useTranslations("cashbox");

  useEffect(() => {
    if (farm) {
      fetchCashboxData();
    }
  }, [farm]);

  const fetchCashboxData = async () => {
    if (!farm) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/farms/${farm.id}/cashbox`);
      const data = await response.json();

      if (data.success) {
        setBalance(data.data.balance);
        setMovements(data.data.movements || []);
      }
    } catch (error) {
      console.error("Error fetching cashbox data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileLayout title={t("title")}>
      <div className="space-y-4">
        <Card>
          <div className="text-center py-6">
            <div className="text-sm text-gray-500 mb-2">{t("balance")}</div>
            {isLoading ? (
              <div className="animate-pulse h-10 bg-gray-200 rounded w-32 mx-auto"></div>
            ) : (
              <div className={`text-3xl font-bold ${(balance?.balance || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {balance?.balance || 0} TND
              </div>
            )}
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

        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!isLoading && movements.length > 0 && (
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3">{t("movements")}</h3>
            <div className="space-y-2">
              {movements.slice(0, 10).map((movement) => (
                <MovementCard key={movement.id} movement={movement} />
              ))}
            </div>
          </Card>
        )}

        {!isLoading && movements.length === 0 && (
          <Card>
            <div className="text-center py-8">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t("noMovements")}</h3>
              <p className="text-gray-600">No transactions recorded yet.</p>
            </div>
          </Card>
        )}
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
