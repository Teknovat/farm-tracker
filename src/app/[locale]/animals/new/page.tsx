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

const typeOptions = [
  { value: "", label: "Select type" },
  { value: "INDIVIDUAL", label: "Individual Animal" },
  { value: "LOT", label: "Lot/Group" },
];

const speciesOptions = [
  { value: "", label: "Select species" },
  { value: "Cow", label: "Cow" },
  { value: "Sheep", label: "Sheep" },
  { value: "Goat", label: "Goat" },
  { value: "Chicken", label: "Chicken" },
  { value: "Other", label: "Other" },
];

const sexOptions = [
  { value: "", label: "Select sex" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
];

const statusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "SOLD", label: "Sold" },
  { value: "DEAD", label: "Dead" },
];

function NewAnimalContent() {
  const router = useRouter();
  const { farm } = useAuth();
  const t = useTranslations("animals");

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
        setError(data.error || "Failed to create animal");
      }
    } catch (error) {
      console.error("Error creating animal:", error);
      setError("Network error. Please try again.");
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
    <MobileLayout title="Add Animal" showBack onBack={() => router.back()}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <div className="space-y-4">
            <Select
              label="Type *"
              options={typeOptions}
              value={formData.type}
              onChange={(e) => handleChange("type", e.target.value)}
              fullWidth
              required
            />

            <Select
              label="Species *"
              options={speciesOptions}
              value={formData.species}
              onChange={(e) => handleChange("species", e.target.value)}
              fullWidth
              required
            />

            {isCustomSpecies && (
              <Input
                label="Custom Species *"
                placeholder="Enter species name"
                value={formData.customSpecies}
                onChange={(e) => handleChange("customSpecies", e.target.value)}
                fullWidth
                required
              />
            )}

            <Select
              label="Status *"
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
            <h3 className="font-medium text-gray-900 mb-4">Individual Animal Details</h3>
            <div className="space-y-4">
              <Select
                label="Sex"
                options={sexOptions}
                value={formData.sex}
                onChange={(e) => handleChange("sex", e.target.value)}
                fullWidth
              />

              <Input
                label="Birth Date"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleChange("birthDate", e.target.value)}
                fullWidth
              />

              <Input
                label="Estimated Age (months)"
                type="number"
                placeholder="e.g., 24"
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
            <h3 className="font-medium text-gray-900 mb-4">Lot Details</h3>
            <div className="space-y-4">
              <Input
                label="Number of Animals *"
                type="number"
                placeholder="e.g., 25"
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
              <h3 className="font-medium text-blue-900 mb-2">Animal Preview</h3>
              <div className="space-y-1 text-sm text-blue-800">
                <div>Type: {typeOptions.find((t) => t.value === formData.type)?.label}</div>
                <div>Species: {isCustomSpecies ? formData.customSpecies : formData.species}</div>
                <div>Status: {formData.status}</div>
                {isIndividual && formData.sex && <div>Sex: {formData.sex}</div>}
                {isIndividual && formData.birthDate && (
                  <div>Birth Date: {new Date(formData.birthDate).toLocaleDateString()}</div>
                )}
                {isIndividual && formData.estimatedAge && <div>Estimated Age: {formData.estimatedAge} months</div>}
                {isLot && formData.lotCount && <div>Lot Size: {formData.lotCount} animals</div>}
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
            {isSubmitting ? "Adding Animal..." : "Add Animal"}
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
