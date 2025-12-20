import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

// Mock data for now - will be replaced with real API calls
const mockCashboxData = {
  balance: 2450.75,
  recentMovements: [
    {
      id: "1",
      type: "DEPOSIT",
      amount: 500.0,
      description: "Monthly budget allocation",
      createdAt: "2024-01-10",
      createdBy: "John Doe",
    },
    {
      id: "2",
      type: "EXPENSE_CASH",
      amount: -125.5,
      description: "Feed purchase",
      category: "FEED",
      createdAt: "2024-01-09",
      createdBy: "Jane Smith",
    },
    {
      id: "3",
      type: "EXPENSE_CREDIT",
      amount: 0, // Credit doesn't affect balance
      description: "Veterinary visit",
      category: "VET",
      createdAt: "2024-01-08",
      createdBy: "Mike Johnson",
    },
    {
      id: "4",
      type: "REIMBURSEMENT",
      amount: -200.0,
      description: "Reimbursement to Mike Johnson",
      createdAt: "2024-01-07",
      createdBy: "John Doe",
    },
  ],
  outstandingDebts: [
    {
      id: "1",
      description: "Equipment repair",
      amount: 350.0,
      remainingAmount: 350.0,
      paidBy: "Mike Johnson",
      createdAt: "2024-01-05",
    },
    {
      id: "2",
      description: "Feed delivery",
      amount: 180.0,
      remainingAmount: 80.0,
      paidBy: "Jane Smith",
      createdAt: "2024-01-03",
    },
  ],
};

function MovementCard({ movement }: { movement: (typeof mockCashboxData.recentMovements)[0] }) {
  const getMovementIcon = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return "💰";
      case "EXPENSE_CASH":
        return "💸";
      case "EXPENSE_CREDIT":
        return "💳";
      case "REIMBURSEMENT":
        return "🔄";
      default:
        return "📝";
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return "text-green-600";
      case "EXPENSE_CASH":
        return "text-red-600";
      case "EXPENSE_CREDIT":
        return "text-blue-600";
      case "REIMBURSEMENT":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  const formatAmount = (amount: number, type: string) => {
    if (type === "EXPENSE_CREDIT") {
      return "Credit";
    }
    return `${amount >= 0 ? "+" : ""}${amount.toFixed(2)} TND`;
  };

  return (
    <div className="flex items-center space-x-3 p-3 border-b border-gray-100 last:border-b-0">
      <span className="text-xl">{getMovementIcon(movement.type)}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 truncate">{movement.description}</h4>
          <span className={`font-medium ${getMovementColor(movement.type)}`}>
            {formatAmount(movement.amount, movement.type)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {movement.category && `${movement.category} • `}
            {movement.createdBy}
          </span>
          <span>{new Date(movement.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

function DebtCard({ debt }: { debt: (typeof mockCashboxData.outstandingDebts)[0] }) {
  const progressPercentage = ((debt.amount - debt.remainingAmount) / debt.amount) * 100;

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">{debt.description}</h4>
        <span className="font-medium text-yellow-700">{debt.remainingAmount.toFixed(2)} TND</span>
      </div>
      <div className="text-sm text-gray-600 mb-2">
        Paid by {debt.paidBy} • {new Date(debt.createdAt).toLocaleDateString()}
      </div>
      <div className="w-full bg-yellow-200 rounded-full h-2">
        <div
          className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {debt.amount - debt.remainingAmount} / {debt.amount} TND reimbursed
      </div>
    </div>
  );
}

export default function CashboxPage() {
  return (
    <MobileLayout title="Cashbox">
      <div className="space-y-4">
        {/* Balance Card */}
        <Card>
          <div className="text-center py-4">
            <div className="text-3xl font-bold text-green-600 mb-2">{mockCashboxData.balance.toFixed(2)} TND</div>
            <div className="text-gray-600">Current Balance</div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/cashbox/deposit">
              <Button fullWidth variant="primary">
                Add Deposit
              </Button>
            </Link>
            <Link href="/cashbox/expense">
              <Button fullWidth variant="secondary">
                Add Expense
              </Button>
            </Link>
            <Link href="/cashbox/reimbursement">
              <Button fullWidth variant="secondary">
                Reimburse
              </Button>
            </Link>
            <Link href="/cashbox/report">
              <Button fullWidth variant="ghost">
                View Report
              </Button>
            </Link>
          </div>
        </Card>

        {/* Outstanding Debts */}
        {mockCashboxData.outstandingDebts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Debts</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              {mockCashboxData.outstandingDebts.map((debt) => (
                <DebtCard key={debt.id} debt={debt} />
              ))}
            </div>
          </Card>
        )}

        {/* Recent Movements */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Movements</CardTitle>
          </CardHeader>
          <div>
            {mockCashboxData.recentMovements.map((movement) => (
              <MovementCard key={movement.id} movement={movement} />
            ))}
          </div>
        </Card>
      </div>
    </MobileLayout>
  );
}
