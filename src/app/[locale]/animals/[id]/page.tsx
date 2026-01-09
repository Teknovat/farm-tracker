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
  fatherId?: string;
  motherId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  createdByName: string;
  updatedByName: string;
}

interface Event {
  id: string;
  eventType: string;
  eventDate: string;
  note?: string;
  cost?: number;
  nextDueDate?: string;
  createdBy?: string;
  createdByName?: string;
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
            <h4 className="font-medium text-gray-900 capitalize">{t(`events.${event.eventType.toLowerCase()}`)}</h4>
            <span className="text-sm text-gray-500">{new Date(event.eventDate).toLocaleDateString()}</span>
          </div>

          {event.note && <p className="mt-1 text-sm text-gray-700">{event.note}</p>}

          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>
              {t("animals.detailPage.eventBy")}{" "}
              {event.createdByName || t("animals.unknownUser")}
            </span>
            {event.cost && (
              <span className="font-medium">
                {t("animals.detailPage.cost")}: {event.cost} TND
              </span>
            )}
          </div>

          {event.nextDueDate && (
            <div className="mt-2 text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
              {t("detailPage.nextDue")}: {new Date(event.nextDueDate).toLocaleDateString()}
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
  const [father, setFather] = useState<Animal | null>(null);
  const [mother, setMother] = useState<Animal | null>(null);
  const [offspring, setOffspring] = useState<Animal[]>([]);
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
        const animalInfo = animalData.data;
        setAnimal(animalInfo);

        // Fetch parents if they exist
        if (animalInfo.fatherId) {
          try {
            const fatherResponse = await fetch(`/api/farms/${farm.id}/animals/${animalInfo.fatherId}`);
            const fatherData = await fatherResponse.json();
            if (fatherData.success) {
              setFather(fatherData.data);
            }
          } catch (error) {
            console.error("Error fetching father data:", error);
          }
        }

        if (animalInfo.motherId) {
          try {
            const motherResponse = await fetch(`/api/farms/${farm.id}/animals/${animalInfo.motherId}`);
            const motherData = await motherResponse.json();
            if (motherData.success) {
              setMother(motherData.data);
            }
          } catch (error) {
            console.error("Error fetching mother data:", error);
          }
        }

        // Fetch offspring - search for animals where this animal is father or mother
        try {
          const offspringResponse = await fetch(`/api/farms/${farm.id}/animals`);
          const offspringData = await offspringResponse.json();
          if (offspringData.success) {
            const children = offspringData.data.filter((a: Animal) => a.fatherId === id || a.motherId === id);
            setOffspring(children);
          }
        } catch (error) {
          console.error("Error fetching offspring data:", error);
        }
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
      <MobileLayout title={t("detailPage.loading")} showBack onBack={() => router.back()}>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </MobileLayout>
    );
  }

  if (!animal) {
    return (
      <MobileLayout title={t("detailPage.notFound")} showBack onBack={() => router.back()}>
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600">{t("detailPage.notFound")}</p>
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
            {t("detailPage.edit")}
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
                <div>
                  {t("detailPage.type")}: {t(animal.type.toLowerCase() as "individual" | "lot")}
                </div>
                {animal.sex && (
                  <div>
                    {t("detailPage.sex")}: {t(animal.sex.toLowerCase() as "male" | "female")}
                  </div>
                )}
                {animal.type === "LOT" && animal.lotCount && (
                  <div>
                    {t("detailPage.count")}: {animal.lotCount} {t("animals.animalInfo.animalsCount")}
                  </div>
                )}
                {animal.birthDate && (
                  <div>
                    {t("detailPage.born")}: {new Date(animal.birthDate).toLocaleDateString()}
                  </div>
                )}
                {animal.estimatedAge && (
                  <div>
                    {t("detailPage.age")}: {animal.estimatedAge} {t("detailPage.months")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Genealogy Section - Only for Individual Animals */}
        {animal.type === "INDIVIDUAL" && (father || mother) && (
          <Card>
            <CardHeader>
              <CardTitle>{t("genealogy")}</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              {father && (
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-2xl">👨</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{t("father")}</div>
                    <Link href={`/animals/${father.id}`} className="text-blue-600 hover:text-blue-800">
                      {father.tagNumber || `${father.species} #${father.id.slice(0, 8)}`}
                    </Link>
                    <div className="text-sm text-gray-600">{father.species}</div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(father.status)}`}>
                    {t(father.status.toLowerCase() as "active" | "sold" | "dead")}
                  </span>
                </div>
              )}

              {mother && (
                <div className="flex items-center space-x-3 p-3 bg-pink-50 rounded-lg">
                  <span className="text-2xl">👩</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{t("mother")}</div>
                    <Link href={`/animals/${mother.id}`} className="text-blue-600 hover:text-blue-800">
                      {mother.tagNumber || `${mother.species} #${mother.id.slice(0, 8)}`}
                    </Link>
                    <div className="text-sm text-gray-600">{mother.species}</div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(mother.status)}`}>
                    {t(mother.status.toLowerCase() as "active" | "sold" | "dead")}
                  </span>
                </div>
              )}

              {!father && !mother && animal.type === "INDIVIDUAL" && (
                <div className="text-center py-4 text-gray-500">{t("noParentsRecorded")}</div>
              )}
            </div>
          </Card>
        )}

        {/* Offspring Section */}
        {offspring.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {t("offspring")} ({offspring.length})
              </CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {offspring.slice(0, 5).map((child) => (
                <Link key={child.id} href={`/animals/${child.id}`}>
                  <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                    <span className="text-lg">🐄</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {child.tagNumber || `${child.species} #${child.id.slice(0, 8)}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        {child.species} • {child.sex && t(child.sex.toLowerCase() as "male" | "female")}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(child.status)}`}>
                      {t(child.status.toLowerCase() as "active" | "sold" | "dead")}
                    </span>
                  </div>
                </Link>
              ))}
              {offspring.length > 5 && (
                <div className="text-center py-2 text-gray-500">{t("andXMore", { count: offspring.length - 5 })}</div>
              )}
            </div>
          </Card>
        )}

        {/* Detailed Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t("detailedInformation")}</CardTitle>
          </CardHeader>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-medium text-gray-900">{t("identifier")}</div>
                <div className="text-gray-600">{animal.id}</div>
              </div>
              {animal.tagNumber && (
                <div>
                  <div className="font-medium text-gray-900">{t("tagNumber")}</div>
                  <div className="text-gray-600">{animal.tagNumber}</div>
                </div>
              )}
            </div>

            <div className="border-t pt-3">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <div className="font-medium text-gray-900">{t("createdOn")}</div>
                  <div className="text-gray-600">
                    {new Date(animal.createdAt).toLocaleString()} {t("by")} {animal.createdByName}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{t("lastUpdated")}</div>
                  <div className="text-gray-600">
                    {new Date(animal.updatedAt).toLocaleString()} {t("by")} {animal.updatedByName}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-medium text-gray-900">{t("totalEvents")}</div>
                  <div className="text-gray-600">{events.length}</div>
                </div>
                {animal.type === "INDIVIDUAL" && (
                  <div>
                    <div className="font-medium text-gray-900">{t("offspring")}</div>
                    <div className="text-gray-600">{offspring.length}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("detailPage.quickActions")}</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3">
            <Link href={`/events/new?animalId=${id}`}>
              <Button fullWidth variant="primary">
                {t("detailPage.addEvent")}
              </Button>
            </Link>
            <Button fullWidth variant="secondary">
              {t("detailPage.takePhoto")}
            </Button>
            <Button fullWidth variant="secondary">
              {t("detailPage.viewTimeline")}
            </Button>
            <Button fullWidth variant="secondary">
              {t("detailPage.generateReport")}
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
            {events.length === 0 && (
              <p className="text-gray-500 text-center py-4">{t("detailPage.noEventsRecorded")}</p>
            )}
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
