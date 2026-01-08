"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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
  estimatedAge?: number;
  lotCount?: number;
  createdAt: string;
}

interface Event {
  id: string;
  eventType: string;
  eventDate: string;
  note?: string;
  cost?: number;
  nextDueDate?: string;
  createdBy?: string;
}

function EventCard({ event }: { event: Event }) {
  const t = useTranslations();
  const getEventIcon = (type: string) => {
    switch (type) {
      case "BIRTH":
        return "🐣";
      case "VACCINATION":
        return "💉";
      case "TREATMENT":
        return "🏥";
      case "WEIGHT":
        return "⚖️";
      case "SALE":
        return "💰";
      case "DEATH":
        return "💀";
      case "NOTE":
        return "📝";
      default:
        return "📅";
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "BIRTH":
        return "bg-green-50 border-green-200";
      case "VACCINATION":
        return "bg-blue-50 border-blue-200";
      case "TREATMENT":
        return "bg-yellow-50 border-yellow-200";
      case "WEIGHT":
        return "bg-purple-50 border-purple-200";
      case "SALE":
        return "bg-emerald-50 border-emerald-200";
      case "DEATH":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getEventColor(event.eventType)}`}>
      <div className="flex items-start space-x-3">
        <span className="text-xl">{getEventIcon(event.eventType)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 capitalize">
              {t(`events.${event.eventType.toLowerCase()}`)}
            </h4>
            <span className="text-sm text-gray-500">{new Date(event.eventDate).toLocaleDateString()}</span>
          </div>

          {event.note && <p className="mt-1 text-sm text-gray-700">{event.note}</p>}

          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>{t("animals.detailPage.eventBy")} {event.createdBy}</span>
            {event.cost && <span className="font-medium">{t("animals.detailPage.cost")}: {event.cost} TND</span>}
          </div>

          {event.nextDueDate && (
            <div className="mt-2 text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
              {t("animals.detailPage.nextDue")}: {new Date(event.nextDueDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AnimalDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { farm } = useAuth();
  const router = useRouter();
  const t = useTranslations("animals");

  useEffect(() => {
    if (farm) {
      fetchAnimalData();
    }
  }, [farm, id]);

  const fetchAnimalData = async () => {
    if (!farm) return;

    setIsLoading(true);
    try {
      // Fetch animal details
      const animalResponse = await fetch(`/api/farms/${farm.id}/animals/${id}`);
      const animalData = await animalResponse.json();

      if (animalData.success) {
        setAnimal(animalData.data);
      }

      // Fetch animal events timeline
      const eventsResponse = await fetch(`/api/farms/${farm.id}/events/timeline/${id}`);
      const eventsData = await eventsResponse.json();

      if (eventsData.success) {
        setEvents(eventsData.data.events);
      }
    } catch (error) {
      console.error("Error fetching animal data:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isLoading) {
    return (
      <MobileLayout title={t("animals.detailPage.loading")} showBack onBack={() => router.back()}>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </MobileLayout>
    );
  }

  if (!animal) {
    return (
      <MobileLayout title={t("animals.detailPage.notFound")} showBack onBack={() => router.back()}>
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600">{t("animals.detailPage.notFound")}</p>
          </div>
        </Card>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      title={animal.tagNumber || `${animal.species} #${id.slice(0, 8)}`}
      showBack
      onBack={() => router.back()}
      actions={
        <Link href={`/animals/${id}/edit`}>
          <Button size="sm" variant="ghost">
            {t("animals.detailPage.edit")}
          </Button>
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Animal Info */}
        <Card>
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
              {animal.photoUrl ? (
                <img src={animal.photoUrl} alt="Animal" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <span className="text-3xl">🐄</span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-gray-900">{animal.species}</h2>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(animal.status)}`}>
                  {t(animal.status.toLowerCase() as "active" | "sold" | "dead")}
                </span>
              </div>

              <div className="space-y-1 text-sm text-gray-600">
                <div>{t("animals.detailPage.type")}: {t(animal.type.toLowerCase() as "individual" | "lot")}</div>
                {animal.sex && <div>{t("animals.detailPage.sex")}: {t(animal.sex.toLowerCase() as "male" | "female")}</div>}
                {animal.type === "LOT" && animal.lotCount && <div>{t("animals.detailPage.count")}: {animal.lotCount} {t("animals.animalInfo.animalsCount")}</div>}
                {animal.birthDate && <div>{t("animals.detailPage.born")}: {new Date(animal.birthDate).toLocaleDateString()}</div>}
                {animal.estimatedAge && <div>{t("animals.detailPage.age")}: {animal.estimatedAge} {t("animals.detailPage.months")}</div>}
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("animals.detailPage.quickActions")}</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3">
            <Link href={`/events/new?animalId=${id}`}>
              <Button fullWidth variant="primary">
                {t("animals.detailPage.addEvent")}
              </Button>
            </Link>
            <Button fullWidth variant="secondary">
              {t("animals.detailPage.takePhoto")}
            </Button>
            <Button fullWidth variant="secondary">
              {t("animals.detailPage.viewTimeline")}
            </Button>
            <Button fullWidth variant="secondary">
              {t("animals.detailPage.generateReport")}
            </Button>
          </div>
        </Card>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle>{t("timeline")}</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
            {events.length === 0 && <p className="text-gray-500 text-center py-4">{t("animals.detailPage.noEventsRecorded")}</p>}
          </div>
        </Card>
      </div>
    </MobileLayout>
  );
}

export default function AnimalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <ProtectedRoute>
      <AnimalDetailContent params={params} />
    </ProtectedRoute>
  );
}
