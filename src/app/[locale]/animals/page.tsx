"use client";

import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/context";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface Animal {
  id: string;
  tagNumber?: string;
  type: "INDIVIDUAL" | "LOT";
  species: string;
  sex?: "MALE" | "FEMALE";
  status: "ACTIVE" | "SOLD" | "DEAD";
  photoUrl?: string | null;
  birthDate?: string;
  lotCount?: number;
  createdAt: string;
}

function AnimalCard({ animal }: { animal: Animal }) {
  const t = useTranslations("animals");
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "SOLD":
        return "bg-blue-100 text-blue-800";
      case "DEAD":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Link href={`/animals/${animal.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
            {animal.photoUrl ? (
              <img src={animal.photoUrl} alt="Animal" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <span className="text-2xl">🐄</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 truncate">
                {animal.tagNumber || `${animal.species} #${animal.id.slice(0, 8)}`}
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(animal.status)}`}>
                {t(animal.status.toLowerCase() as "active" | "sold" | "dead")}
              </span>
            </div>

            <div className="mt-1 text-sm text-gray-600">
              {animal.type === "INDIVIDUAL" ? (
                <>
                  {animal.sex && t(animal.sex.toLowerCase() as "male" | "female")}
                  {animal.sex && animal.birthDate && " • "}
                  {animal.birthDate && `${t("animalInfo.born")} ${new Date(animal.birthDate).toLocaleDateString()}`}
                </>
              ) : (
                <>{t("animalInfo.lotOf")} {animal.lotCount} {t("animalInfo.animalsCount")}</>
              )}
            </div>

            <div className="mt-1 text-xs text-gray-500">
              {t("animalInfo.added")} {new Date(animal.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function AnimalsContent() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [speciesFilter, setSpeciesFilter] = useState("ALL");
  const { farm } = useAuth();
  const t = useTranslations("animals");

  // Create status filter options with translations
  const statusOptions = [
    { value: "ALL", label: t("filters.allStatus") },
    { value: "ACTIVE", label: t("active") },
    { value: "SOLD", label: t("sold") },
    { value: "DEAD", label: t("dead") },
  ];

  useEffect(() => {
    if (farm) {
      fetchAnimals();
    }
  }, [farm, statusFilter, speciesFilter]);

  const fetchAnimals = async () => {
    if (!farm) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (speciesFilter !== "ALL") params.append("species", speciesFilter);

      const response = await fetch(`/api/farms/${farm.id}/animals?${params}`);
      const data = await response.json();

      if (data.success) {
        setAnimals(data.data);
      }
    } catch (error) {
      console.error("Error fetching animals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique species for filter
  const speciesOptions = [
    { value: "ALL", label: t("filters.allSpecies") },
    ...Array.from(new Set(animals.map(a => a.species))).map(species => ({
      value: species,
      label: species
    }))
  ];

  return (
    <MobileLayout
      title={t("title")}
      actions={
        <Link href="/animals/new">
          <Button size="sm">{t("addAnimal")}</Button>
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Filters */}
        <Card>
          <div className="grid grid-cols-2 gap-3">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              fullWidth
            />
            <Select
              options={speciesOptions}
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
              fullWidth
            />
          </div>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Animals List */}
        {!isLoading && animals.length > 0 && (
          <div className="space-y-3">
            {animals.map((animal) => (
              <AnimalCard key={animal.id} animal={animal} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && animals.length === 0 && (
          <Card>
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🐄</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t("noAnimals")}</h3>
              <p className="text-gray-600 mb-4">{t("noAnimalsMessage")}</p>
              <Link href="/animals/new">
                <Button>{t("addAnimal")}</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
}

export default function AnimalsPage() {
  return (
    <ProtectedRoute>
      <AnimalsContent />
    </ProtectedRoute>
  );
}
