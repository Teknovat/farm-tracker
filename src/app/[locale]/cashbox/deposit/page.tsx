"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function DepositPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Submit to API
      console.log("Submitting deposit:", formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate back to cashbox
      router.push("/cashbox");
    } catch (error) {
      console.error("Error creating deposit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <MobileLayout title="Add Deposit" showBack onBack={() => router.back()}>
      <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="e.g., Monthly budget allocation"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
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

        {/* Preview */}
        {formData.amount && formData.description && (
          <Card>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Deposit Preview</h3>
              <div className="space-y-1 text-sm text-green-800">
                <div>Amount: +{parseFloat(formData.amount || "0").toFixed(2)} TND</div>
                <div>Description: {formData.description}</div>
                <div>Date: {new Date(formData.date).toLocaleDateString()}</div>
              </div>
            </div>
          </Card>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <Button type="submit" fullWidth disabled={isSubmitting || !formData.amount || !formData.description}>
            {isSubmitting ? "Adding Deposit..." : "Add Deposit"}
          </Button>
        </div>
      </form>
    </MobileLayout>
  );
}
