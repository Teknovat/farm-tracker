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
  type: "DEPOSIT" | "EXPENSE_CASH" | "EXPENSE_CREDIT" | "REIMBURSEMENT";
  amount: number;
  description: string;
  category?: string;
  createdAt: string;
  createdByName?: string;
  paidByName?: string;
}

interface CashboxBalance {
  balance: number;
  totalDeposits: number;
  totalCashExpenses: number;
  totalReimbursements: number;
}

function MovementCard({ movement }: { movement: CashboxMovement }) {
  const getMovementIcon = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return "💰";
      case "EXPENSE_CASH":
        return "💸";
      case "EXPENSE_CREDIT":
        return "💳";
      case "REIMBURSEMENT":
        return "💵";
      default:
        return "💸";
    }
  };

  const getMovementSign = (type: string) => {
    return type === "DEPOSIT" ? "+" : "-";
  };

  const getMovementColor = (type: string) => {
    return type === "DEPOSIT" ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span>{getMovementIcon(movement.type)}</span>
          <div>
            <p className="font-medium text-gray-900">{movement.description}</p>
            {movement.category && (
              <p className="text-xs text-gray-500">{movement.category}</p>
            )}
            <p className="text-xs text-gray-500">
              {new Date(movement.createdAt).toLocaleDateString()}
              {movement.paidByName && movement.type === "DEPOSIT" && ` • Par: ${movement.paidByName}`}
              {movement.createdByName && movement.type !== "DEPOSIT" && ` • ${movement.createdByName}`}
            </p>
          </div>
        </div>
      </div>
      <div className={`text-right ${getMovementColor(movement.type)}`}>
        <p className="font-semibold">
          {getMovementSign(movement.type)}{movement.amount} TND
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
        // L'API retourne la structure directement dans data
        setBalance({
          balance: data.data.balance,
          totalDeposits: data.data.totalDeposits,
          totalCashExpenses: data.data.totalCashExpenses,
          totalReimbursements: data.data.totalReimbursements,
        });
        setMovements(data.data.recentMovements || []);
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
