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
import { useTranslations } from "next-intl";

function NewAnimalContent() {
  const router = useRouter();
  const { farm } = useAuth();
  const t = useTranslations("animals");
  const tCommon = useTranslations("common");
  const tForms = useTranslations("forms");

  // Dynamic options using translations
  const typeOptions = [
    { value: "", label: tForms("selectOption") },
    { value: "INDIVIDUAL", label: t("individual") },
    { value: "LOT", label: t("lot") },
  ];

  const speciesOptions = [
    { value: "", label: tForms("selectOption") },
    { value: "Cow", label: t("species.cow") },
    { value: "Sheep", label: t("species.sheep") },
    { value: "Goat", label: t("species.goat") },
    { value: "Chicken", label: t("species.chicken") },
    { value: "Other", label: t("species.other") },
  ];

  const sexOptions = [
    { value: "", label: tForms("selectOption") },
    { value: "MALE", label: t("male") },
    { value: "FEMALE", label: t("female") },
  ];

  const statusOptions = [
    { value: "ACTIVE", label: t("active") },
    { value: "SOLD", label: t("sold") },
    { value: "DEAD", label: t("dead") },
  ];

  const [formData, setFormData] = useState({
    type: "",
    species: "",
    customSpecies: "",
    sex: "",
    birthDate: "",
    estimatedAge: "",
    status: "ACTIVE",
    lotCount: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farm) return;

    setIsSubmitting(true);
    setError("");

    try {
      const animalData = {
        type: formData.type,
        species: formData.species === "Other" ? formData.customSpecies : formData.species,
        sex: formData.sex || undefined,
        birthDate: formData.birthDate || undefined,
        estimatedAge: formData.estimatedAge ? parseInt(formData.estimatedAge) : undefined,
        status: formData.status,
        lotCount: formData.type === "LOT" && formData.lotCount ? parseInt(formData.lotCount) : undefined,
      };

      const response = await fetch(`/api/farms/${farm.id}/animals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(animalData),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/animals");
      } else {
        setError(data.error || t("animalCreated")); // This should be an error message
      }
    } catch (error) {
      console.error("Error creating animal:", error);
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isIndividual = formData.type === "INDIVIDUAL";
  const isLot = formData.type === "LOT";
  const isCustomSpecies = formData.species === "Other";

  return (
    <MobileLayout title={t("addAnimal")} showBack onBack={() => router.back()}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

        <Card>
          <div className="space-y-4">
            <Select
              label={`${t("type")} *`}
              options={typeOptions}
              value={formData.type}
              onChange={(e) => handleChange("type", e.target.value)}
              fullWidth
              required
            />

            <Select
              label={`${t("species")} *`}
              options={speciesOptions}
              value={formData.species}
              onChange={(e) => handleChange("species", e.target.value)}
              fullWidth
              required
            />

            {isCustomSpecies && (
              <Input
                label={`${t("species")} personnalisée *`}
                placeholder="Saisir le nom de l'espèce"
                value={formData.customSpecies}
                onChange={(e) => handleChange("customSpecies", e.target.value)}
                fullWidth
                required
              />
            )}

            <Select
              label={`${t("status")} *`}
              options={statusOptions}
              value={formData.status}
              onChange={(e) => handleChange("status", e.target.value)}
              fullWidth
              required
            />
          </div>
        </Card>

        {/* Individual Animal Fields */}
        {isIndividual && (
          <Card>
            <h3 className="font-medium text-gray-900 mb-4">Détails de l'animal individuel</h3>
            <div className="space-y-4">
              <Select
                label={t("sex")}
                options={sexOptions}
                value={formData.sex}
                onChange={(e) => handleChange("sex", e.target.value)}
                fullWidth
              />

              <Input
                label={t("birthDate")}
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleChange("birthDate", e.target.value)}
                fullWidth
              />

              <Input
                label={`${t("estimatedAge")} (mois)`}
                type="number"
                placeholder="ex: 24"
                value={formData.estimatedAge}
                onChange={(e) => handleChange("estimatedAge", e.target.value)}
                fullWidth
              />
            </div>
          </Card>
        )}

        {/* Lot Fields */}
        {isLot && (
          <Card>
            <h3 className="font-medium text-gray-900 mb-4">Détails du lot</h3>
            <div className="space-y-4">
              <Input
                label={`${t("lotCount")} *`}
                type="number"
                placeholder="ex: 25"
                value={formData.lotCount}
                onChange={(e) => handleChange("lotCount", e.target.value)}
                fullWidth
                required
              />
            </div>
          </Card>
        )}

        {/* Preview */}
        {formData.type && formData.species && (
          <Card>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Aperçu de l'animal</h3>
              <div className="space-y-1 text-sm text-blue-800">
                <div>
                  {t("type")}: {typeOptions.find((t) => t.value === formData.type)?.label}
                </div>
                <div>
                  {t("species")}: {isCustomSpecies ? formData.customSpecies : formData.species}
                </div>
                <div>
                  {t("status")}: {statusOptions.find((s) => s.value === formData.status)?.label}
                </div>
                {isIndividual && formData.sex && (
                  <div>
                    {t("sex")}: {sexOptions.find((s) => s.value === formData.sex)?.label}
                  </div>
                )}
                {isIndividual && formData.birthDate && (
                  <div>
                    {t("birthDate")}: {new Date(formData.birthDate).toLocaleDateString("fr-FR")}
                  </div>
                )}
                {isIndividual && formData.estimatedAge && (
                  <div>
                    {t("estimatedAge")}: {formData.estimatedAge} mois
                  </div>
                )}
                {isLot && formData.lotCount && <div>Taille du lot: {formData.lotCount} animaux</div>}
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
              isSubmitting ||
              !formData.type ||
              !formData.species ||
              (isCustomSpecies && !formData.customSpecies) ||
              (isLot && !formData.lotCount)
            }
          >
            {isSubmitting ? "Ajout en cours..." : t("addAnimal")}
          </Button>
        </div>
      </form>
    </MobileLayout>
  );
}

export default function NewAnimalsPage() {
  return (
    <ProtectedRoute>
      <NewAnimalContent />
    </ProtectedRoute>
  );
}
