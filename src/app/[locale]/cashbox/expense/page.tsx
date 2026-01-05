"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/context";

function ExpenseContent() {
  const router = useRouter();
  const { farm } = useAuth();
  const t = useTranslations("cashbox");
  const tCommon = useTranslations("common");
  const tForms = useTranslations("forms");

  const categoryOptions = [
    { value: "", label: tForms("selectOption") },
    { value: "FEED", label: t("categories.feed") },
    { value: "VET", label: t("categories.vet") },
    { value: "LABOR", label: t("categories.labor") },
    { value: "TRANSPORT", label: t("categories.transport") },
    { value: "EQUIPMENT", label: t("categories.equipment") },
    { value: "UTILITIES", label: t("categories.utilities") },
    { value: "OTHER", label: t("categories.other") },
  ];

  const paymentTypeOptions = [
    { value: "", label: "Sélectionner le type de paiement" },
    { value: "CASH", label: "Espèces (de la caisse)" },
    { value: "CREDIT", label: "Crédit (payé par un membre)" },
  ];

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
        setError(data.error || "Échec de l'ajout de la dépense");
      }
    } catch (error) {
      console.error("Error creating expense:", error);
      setError("Erreur réseau. Veuillez réessayer.");
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
      return "Ceci diminuera le solde de la caisse";
    } else if (formData.paymentType === "CREDIT") {
      return "Ceci créera une dette interne (aucun impact sur la caisse)";
    }
    return "";
  };

  return (
    <MobileLayout title={t("addExpense")} showBack onBack={() => router.back()}>
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
              placeholder="ex: Achat d'aliments, Visite vétérinaire"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              fullWidth
              required
            />

            <Select
              label={`${t("category")} *`}
              options={categoryOptions}
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
              fullWidth
              required
            />

            <Select
              label={`${t("expenseType")} *`}
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
                {formData.paymentType === "CASH" ? "Paiement en espèces" : "Paiement à crédit"}
              </h3>
              <p className="text-sm">{getPreviewText()}</p>
            </div>
          </Card>
        )}

        {/* Preview */}
        {formData.amount && formData.description && formData.category && formData.paymentType && (
          <Card>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Aperçu de la dépense</h3>
              <div className="space-y-1 text-sm text-gray-700">
                <div>
                  {t("amount")}: {parseFloat(formData.amount || "0").toFixed(2)} TND
                </div>
                <div>
                  {t("description")}: {formData.description}
                </div>
                <div>
                  {t("category")}: {categoryOptions.find((c) => c.value === formData.category)?.label}
                </div>
                <div>Paiement: {paymentTypeOptions.find((p) => p.value === formData.paymentType)?.label}</div>
                <div>Date: {new Date(formData.date).toLocaleDateString("fr-FR")}</div>
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
            {isSubmitting ? "Ajout en cours..." : t("addExpense")}
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
