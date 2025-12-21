"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/context";

const categoryOptions = [
  { value: "", label: "Select category" },
  { value: "FEED", label: "Feed" },
  { value: "VET", label: "Veterinary" },
  { value: "LABOR", label: "Labor" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "EQUIPMENT", label: "Equipment" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "OTHER", label: "Other" },
];

const paymentTypeOptions = [
  { value: "", label: "Select payment type" },
  { value: "CASH", label: "Cash (from cashbox)" },
  { value: "CREDIT", label: "Credit (paid by member)" },
];

function ExpenseContent() {
  const router = useRouter();
  const { farm } = useAuth();

  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "",
    paymentType: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farm) return;

    setIsSubmitting(true);
    setError("");

    try {
      const expenseData = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        paymentType: formData.paymentType,
        date: formData.date,
      };

      const response = await fetch(`/api/farms/${farm.id}/cashbox/expense`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expenseData),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/cashbox");
      } else {
        setError(data.error || "Failed to add expense");
      }
    } catch (error) {
      console.error("Error creating expense:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getPreviewColor = () => {
    return formData.paymentType === "CASH" ? "bg-red-50 text-red-800" : "bg-blue-50 text-blue-800";
  };

  const getPreviewText = () => {
    if (formData.paymentType === "CASH") {
      return "This will decrease the cashbox balance";
    } else if (formData.paymentType === "CREDIT") {
      return "This will create internal debt (no cashbox impact)";
    }
    return "";
  };

  return (
    <MobileLayout title="Add Expense" showBack onBack={() => router.back()}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <Card>
          <div className="space-y-4">
            <Input
              label="Amount (TND) *"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              fullWidth
              required
            />

            <Input
              label="Description *"
              placeholder="e.g., Feed purchase, Veterinary visit"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              fullWidth
              required
            />

            <Select
              label="Category *"
              options={categoryOptions}
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
              fullWidth
              required
            />

            <Select
              label="Payment Type *"
              options={paymentTypeOptions}
              value={formData.paymentType}
              onChange={(e) => handleChange("paymentType", e.target.value)}
              fullWidth
              required
            />

            <Input
              label="Date *"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange("date", e.target.value)}
              fullWidth
              required
            />
          </div>
        </Card>

        {/* Payment Type Info */}
        {formData.paymentType && (
          <Card>
            <div className={`p-4 rounded-lg ${getPreviewColor()}`}>
              <h3 className="font-medium mb-2">
                {formData.paymentType === "CASH" ? "Cash Payment" : "Credit Payment"}
              </h3>
              <p className="text-sm">{getPreviewText()}</p>
            </div>
          </Card>
        )}

        {/* Preview */}
        {formData.amount && formData.description && formData.category && formData.paymentType && (
          <Card>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Expense Preview</h3>
              <div className="space-y-1 text-sm text-gray-700">
                <div>Amount: {parseFloat(formData.amount || "0").toFixed(2)} TND</div>
                <div>Description: {formData.description}</div>
                <div>Category: {categoryOptions.find((c) => c.value === formData.category)?.label}</div>
                <div>Payment: {paymentTypeOptions.find((p) => p.value === formData.paymentType)?.label}</div>
                <div>Date: {new Date(formData.date).toLocaleDateString()}</div>
              </div>
            </div>
          </Card>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            fullWidth
            disabled={
              isSubmitting || !formData.amount || !formData.description || !formData.category || !formData.paymentType
            }
          >
            {isSubmitting ? "Adding Expense..." : "Add Expense"}
          </Button>
        </div>
      </form>
    </MobileLayout>
  );
}

export default function ExpensePage() {
  return (
    <ProtectedRoute>
      <ExpenseContent />
    </ProtectedRoute>
  );
}
