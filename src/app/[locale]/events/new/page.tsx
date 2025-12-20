"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

function NewEventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const preselectedAnimalId = searchParams.get("animalId");

  const eventTypeOptions = [
    { value: "", label: t("forms.selectOption") },
    { value: "BIRTH", label: t("events.birth") },
    { value: "VACCINATION", label: t("events.vaccination") },
    { value: "TREATMENT", label: t("events.treatment") },
    { value: "WEIGHT", label: t("events.weight") },
    { value: "SALE", label: t("events.sale") },
    { value: "DEATH", label: t("events.death") },
    { value: "NOTE", label: t("events.note") },
  ];

  const animalOptions = [
    { value: "", label: t("forms.selectAnimal") },
    { value: "1", label: "Cow #1" },
    { value: "2", label: "Sheep Lot A" },
    { value: "3", label: "Goat #3" },
  ];

  const categoryOptions = [
    { value: "", label: `${t("forms.selectOption")} (${t("forms.optional")})` },
    { value: "FEED", label: t("cashbox.categories.feed") },
    { value: "VET", label: t("cashbox.categories.vet") },
    { value: "LABOR", label: t("cashbox.categories.labor") },
    { value: "TRANSPORT", label: t("cashbox.categories.transport") },
    { value: "EQUIPMENT", label: t("cashbox.categories.equipment") },
    { value: "UTILITIES", label: t("cashbox.categories.utilities") },
    { value: "OTHER", label: t("cashbox.categories.other") },
  ];

  const [formData, setFormData] = useState({
    animalId: preselectedAnimalId || "",
    eventType: "",
    eventDate: new Date().toISOString().split("T")[0],
    note: "",
    cost: "",
    nextDueDate: "",
    category: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Submit to API
      console.log("Submitting event:", formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate back or to success page
      router.push("/events");
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <MobileLayout title={t("events.recordEvent")} showBack onBack={() => router.back()}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <div className="space-y-4">
            <Select
              label={`${t("events.targetAnimal")} *`}
              options={animalOptions}
              value={formData.animalId}
              onChange={(e) => handleChange("animalId", e.target.value)}
              fullWidth
              required
            />

            <Select
              label={`${t("events.eventType")} *`}
              options={eventTypeOptions}
              value={formData.eventType}
              onChange={(e) => handleChange("eventType", e.target.value)}
              fullWidth
              required
            />

            <Input
              label={`${t("events.eventDate")} *`}
              type="date"
              value={formData.eventDate}
              onChange={(e) => handleChange("eventDate", e.target.value)}
              fullWidth
              required
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">{t("events.notes")}</label>
              <textarea
                className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-base placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[88px]"
                placeholder={t("events.addAdditionalNotes")}
                value={formData.note}
                onChange={(e) => handleChange("note", e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Optional Fields */}
        <Card>
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">{t("events.optionalInformation")}</h3>

            <Input
              label={`${t("events.cost")} (TND)`}
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.cost}
              onChange={(e) => handleChange("cost", e.target.value)}
              fullWidth
            />

            <Input
              label={t("events.nextDueDate")}
              type="date"
              value={formData.nextDueDate}
              onChange={(e) => handleChange("nextDueDate", e.target.value)}
              fullWidth
            />

            <Select
              label={t("cashbox.category")}
              options={categoryOptions}
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
              fullWidth
            />
          </div>
        </Card>

        {/* Submit Button */}
        <div className="pt-4">
          <Button type="submit" fullWidth disabled={isSubmitting || !formData.animalId || !formData.eventType}>
            {isSubmitting ? t("events.recordingEvent") : t("events.recordEvent")}
          </Button>
        </div>
      </form>
    </MobileLayout>
  );
}

export default function NewEventPage() {
  const t = useTranslations();

  return (
    <Suspense
      fallback={
        <MobileLayout title={t("events.recordEvent")}>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">{t("common.loading")}</div>
          </div>
        </MobileLayout>
      }
    >
      <NewEventForm />
    </Suspense>
  );
}
