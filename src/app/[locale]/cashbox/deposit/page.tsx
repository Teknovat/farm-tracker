"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/context";

function DepositContent() {
  const router = useRouter();
  const { farm } = useAuth();
  const t = useTranslations("cashbox");
  const tCommon = useTranslations("common");
  const tForms = useTranslations("forms");

  const [formData, setFormData] = useState({
    amount: "",
    description: "",
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
      const depositData = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: formData.date,
      };

      const response = await fetch(`/api/farms/${farm.id}/cashbox/deposit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(depositData),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/cashbox");
      } else {
        setError(data.error || "Échec de l'ajout du dépôt");
      }
    } catch (error) {
      console.error("Error creating deposit:", error);
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <MobileLayout title={t("addDeposit")} showBack onBack={() => router.back()}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

        <Card>
          <div className="space-y-4">
            <Input
              label={`${t("amount")} (TND) *`}
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              fullWidth
              required
            />

            <Input
              label={`${t("description")} *`}
              placeholder="ex: Allocation budgétaire mensuelle"
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
              <h3 className="font-medium text-green-900 mb-2">Aperçu du dépôt</h3>
              <div className="space-y-1 text-sm text-green-800">
                <div>
                  {t("amount")}: +{parseFloat(formData.amount || "0").toFixed(2)} TND
                </div>
                <div>
                  {t("description")}: {formData.description}
                </div>
                <div>Date: {new Date(formData.date).toLocaleDateString("fr-FR")}</div>
              </div>
            </div>
          </Card>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <Button type="submit" fullWidth disabled={isSubmitting || !formData.amount || !formData.description}>
            {isSubmitting ? "Ajout en cours..." : t("addDeposit")}
          </Button>
        </div>
      </form>
    </MobileLayout>
  );
}

export default function DepositPage() {
  return (
    <ProtectedRoute>
      <DepositContent />
    </ProtectedRoute>
  );
}
