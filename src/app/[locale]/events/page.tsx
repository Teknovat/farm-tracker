"use client";

import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useTranslations } from "next-intl";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/context";
import Link from "next/link";

interface Event {
  id: string;
  eventType: string;
  eventDate: string;
  targetId: string;
  targetType: string;
  note?: string;
  cost?: number;
  nextDueDate?: string;
}

function EventCard({ event }: { event: Event }) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case "BIRTH": return "🐣";
      case "VACCINATION": return "💉";
      case "TREATMENT": return "🏥";
      case "WEIGHT": return "⚖️";
      case "SALE": return "💰";
      case "DEATH": return "💀";
      case "NOTE": return "📝";
      default: return "📅";
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "BIRTH": return "bg-green-50 border-green-200";
      case "VACCINATION": return "bg-blue-50 border-blue-200";
      case "TREATMENT": return "bg-yellow-50 border-yellow-200";
      case "WEIGHT": return "bg-purple-50 border-purple-200";
      case "SALE": return "bg-emerald-50 border-emerald-200";
      case "DEATH": return "bg-red-50 border-red-200";
      default: return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getEventColor(event.eventType)}`}>
      <div className="flex items-start space-x-3">
        <span className="text-xl">{getEventIcon(event.eventType)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 capitalize">{event.eventType.toLowerCase()}</h4>
            <span className="text-sm text-gray-500">{new Date(event.eventDate).toLocaleDateString()}</span>
          </div>
          {event.note && <p className="mt-1 text-sm text-gray-700">{event.note}</p>}
          {event.cost && <p className="mt-1 text-xs font-medium text-gray-600">Cost: {event.cost} TND</p>}
          {event.nextDueDate && (
            <div className="mt-2 text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
              Next due: {new Date(event.nextDueDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EventsContent() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { farm } = useAuth();
  const t = useTranslations("events");

  useEffect(() => {
    if (farm) {
      fetchEvents();
    }
  }, [farm]);

  const fetchEvents = async () => {
    if (!farm) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/farms/${farm.id}/events`);
      const data = await response.json();

      if (data.success) {
        setEvents(data.data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileLayout
      title={t("title")}
      actions={
        <Link href="/events/new">
          <Button size="sm">{t("addEvent")}</Button>
        </Link>
      }
    >
      <div className="space-y-4">
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!isLoading && events.length > 0 && (
          <div className="space-y-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {!isLoading && events.length === 0 && (
          <Card>
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t("noEvents")}</h3>
              <p className="text-gray-600 mb-4">Start by recording your first event.</p>
              <Link href="/events/new">
                <Button>{t("recordEvent")}</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
}

export default function EventsPage() {
  return (
    <ProtectedRoute>
      <EventsContent />
    </ProtectedRoute>
  );
}
