import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import Link from "next/link";

// Mock data for now - will be replaced with real API calls
const mockEvents = [
  {
    id: "1",
    eventType: "VACCINATION",
    eventDate: "2024-01-10",
    animal: "Cow #1",
    note: "Annual vaccination completed",
    cost: 45.5,
    createdBy: "Jane Smith",
  },
  {
    id: "2",
    eventType: "BIRTH",
    eventDate: "2024-01-08",
    animal: "Sheep Lot A",
    note: "3 healthy lambs born",
    createdBy: "John Doe",
  },
  {
    id: "3",
    eventType: "WEIGHT",
    eventDate: "2024-01-05",
    animal: "Cow #1",
    note: "Weight: 450kg",
    createdBy: "Mike Johnson",
  },
  {
    id: "4",
    eventType: "TREATMENT",
    eventDate: "2024-01-03",
    animal: "Goat #3",
    note: "Treated for minor infection",
    cost: 30.0,
    nextDueDate: "2024-01-17",
    createdBy: "Jane Smith",
  },
];

const eventTypeOptions = [
  { value: "ALL", label: "All Events" },
  { value: "BIRTH", label: "Birth" },
  { value: "VACCINATION", label: "Vaccination" },
  { value: "TREATMENT", label: "Treatment" },
  { value: "WEIGHT", label: "Weight" },
  { value: "SALE", label: "Sale" },
  { value: "DEATH", label: "Death" },
  { value: "NOTE", label: "Note" },
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
    <Card className={`border ${getEventColor(event.eventType)}`}>
      <div className="flex items-start space-x-3">
        <span className="text-xl">{getEventIcon(event.eventType)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-gray-900 capitalize">{event.eventType.toLowerCase()}</h3>
            <span className="text-sm text-gray-500">{new Date(event.eventDate).toLocaleDateString()}</span>
          </div>

          <div className="text-sm text-gray-700 mb-1">{event.animal}</div>

          {event.note && <p className="text-sm text-gray-600 mb-2">{event.note}</p>}

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>By {event.createdBy}</span>
            {event.cost && <span className="font-medium text-gray-700">{event.cost.toFixed(2)} TND</span>}
          </div>

          {event.nextDueDate && (
            <div className="mt-2 text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded inline-block">
              Next due: {new Date(event.nextDueDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function EventsPage() {
  return (
    <MobileLayout
      title="Events"
      actions={
        <Link href="/events/new">
          <Button size="sm">Add Event</Button>
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Filters */}
        <Card>
          <Select options={eventTypeOptions} defaultValue="ALL" fullWidth />
        </Card>

        {/* Events List */}
        <div className="space-y-3">
          {mockEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {mockEvents.length === 0 && (
          <Card>
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
              <p className="text-gray-600 mb-4">Start recording animal events to track their lifecycle.</p>
              <Link href="/events/new">
                <Button>Record First Event</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
}
