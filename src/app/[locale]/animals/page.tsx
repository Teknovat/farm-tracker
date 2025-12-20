import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import Link from "next/link";

// Mock data for now - will be replaced with real API calls
const mockAnimals = [
  {
    id: "1",
    type: "INDIVIDUAL",
    species: "Cow",
    sex: "FEMALE",
    status: "ACTIVE",
    photoUrl: null,
    birthDate: "2022-03-15",
    createdAt: "2023-01-10",
  },
  {
    id: "2",
    type: "LOT",
    species: "Sheep",
    status: "ACTIVE",
    lotCount: 25,
    photoUrl: null,
    createdAt: "2023-02-20",
  },
  {
    id: "3",
    type: "INDIVIDUAL",
    species: "Goat",
    sex: "MALE",
    status: "SOLD",
    photoUrl: null,
    birthDate: "2021-08-10",
    createdAt: "2023-01-05",
  },
];

const statusOptions = [
  { value: "ALL", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "SOLD", label: "Sold" },
  { value: "DEAD", label: "Dead" },
];

const speciesOptions = [
  { value: "ALL", label: "All Species" },
  { value: "Cow", label: "Cow" },
  { value: "Sheep", label: "Sheep" },
  { value: "Goat", label: "Goat" },
];

function AnimalCard({ animal }: { animal: (typeof mockAnimals)[0] }) {
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
                {animal.species} #{animal.id}
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(animal.status)}`}>
                {animal.status}
              </span>
            </div>

            <div className="mt-1 text-sm text-gray-600">
              {animal.type === "INDIVIDUAL" ? (
                <>
                  {animal.sex} • Born {animal.birthDate}
                </>
              ) : (
                <>Lot of {animal.lotCount} animals</>
              )}
            </div>

            <div className="mt-1 text-xs text-gray-500">Added {new Date(animal.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function AnimalsPage() {
  return (
    <MobileLayout
      title="Animals"
      actions={
        <Link href="/animals/new">
          <Button size="sm">Add Animal</Button>
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Filters */}
        <Card>
          <div className="grid grid-cols-2 gap-3">
            <Select options={statusOptions} defaultValue="ALL" fullWidth />
            <Select options={speciesOptions} defaultValue="ALL" fullWidth />
          </div>
        </Card>

        {/* Animals List */}
        <div className="space-y-3">
          {mockAnimals.map((animal) => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>

        {mockAnimals.length === 0 && (
          <Card>
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🐄</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No animals yet</h3>
              <p className="text-gray-600 mb-4">Start by adding your first animal to the farm.</p>
              <Link href="/animals/new">
                <Button>Add First Animal</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
}
