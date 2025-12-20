"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

// Mock data for now - will be replaced with real API calls
const mockAnimal = {
  id: "1",
  type: "INDIVIDUAL",
  species: "Cow",
  sex: "FEMALE",
  status: "ACTIVE",
  photoUrl: null,
  birthDate: "2022-03-15",
  estimatedAge: 22,
  createdAt: "2023-01-10",
};

const mockEvents = [
  {
    id: "1",
    eventType: "BIRTH",
    eventDate: "2022-03-15",
    note: "Healthy birth, no complications",
    createdBy: "John Doe",
  },
  {
    id: "2",
    eventType: "VACCINATION",
    eventDate: "2023-04-10",
    note: "Annual vaccination completed",
    cost: 45.5,
    nextDueDate: "2024-04-10",
    createdBy: "Jane Smith",
  },
  {
    id: "3",
    eventType: "WEIGHT",
    eventDate: "2023-06-15",
    note: "Weight: 450kg",
    createdBy: "John Doe",
  },
];

function EventCard({ event }: { event: (typeof mockEvents)[0] }) {
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
            <h4 className="font-medium text-gray-900 capitalize">{event.eventType.toLowerCase()}</h4>
            <span className="text-sm text-gray-500">{new Date(event.eventDate).toLocaleDateString()}</span>
          </div>

          {event.note && <p className="mt-1 text-sm text-gray-700">{event.note}</p>}

          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>By {event.createdBy}</span>
            {event.cost && <span className="font-medium">Cost: {event.cost} TND</span>}
          </div>

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

export default function AnimalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

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
    <MobileLayout
      title={`${mockAnimal.species} #${id}`}
      showBack
      onBack={() => router.back()}
      actions={
        <Link href={`/animals/${id}/edit`}>
          <Button size="sm" variant="ghost">
            Edit
          </Button>
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Animal Info */}
        <Card>
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
              {mockAnimal.photoUrl ? (
                <img src={mockAnimal.photoUrl} alt="Animal" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <span className="text-3xl">🐄</span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  {mockAnimal.species} #{id}
                </h2>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(mockAnimal.status)}`}>
                  {mockAnimal.status}
                </span>
              </div>

              <div className="space-y-1 text-sm text-gray-600">
                <div>Type: {mockAnimal.type}</div>
                {mockAnimal.sex && <div>Sex: {mockAnimal.sex}</div>}
                {mockAnimal.birthDate && <div>Born: {new Date(mockAnimal.birthDate).toLocaleDateString()}</div>}
                {mockAnimal.estimatedAge && <div>Age: {mockAnimal.estimatedAge} months</div>}
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3">
            <Link href={`/events/new?animalId=${id}`}>
              <Button fullWidth variant="primary">
                Add Event
              </Button>
            </Link>
            <Button fullWidth variant="secondary">
              Take Photo
            </Button>
            <Button fullWidth variant="secondary">
              View Timeline
            </Button>
            <Button fullWidth variant="secondary">
              Generate Report
            </Button>
          </div>
        </Card>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {mockEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
            {mockEvents.length === 0 && <p className="text-gray-500 text-center py-4">No events recorded yet</p>}
          </div>
        </Card>
      </div>
    </MobileLayout>
  );
}
