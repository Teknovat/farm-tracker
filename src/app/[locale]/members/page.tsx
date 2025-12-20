import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

// Mock data for now - will be replaced with real API calls
const mockMembers = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "OWNER",
    status: "ACTIVE",
    joinedAt: "2023-01-01",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "ASSOCIATE",
    status: "ACTIVE",
    joinedAt: "2023-02-15",
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike@example.com",
    role: "WORKER",
    status: "ACTIVE",
    joinedAt: "2023-03-10",
  },
  {
    id: "4",
    name: "Sarah Wilson",
    email: "sarah@example.com",
    role: "ASSOCIATE",
    status: "INACTIVE",
    joinedAt: "2023-01-20",
  },
];

function MemberCard({ member }: { member: (typeof mockMembers)[0] }) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-purple-100 text-purple-800";
      case "ASSOCIATE":
        return "bg-blue-100 text-blue-800";
      case "WORKER":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return "👑";
      case "ASSOCIATE":
        return "👨‍💼";
      case "WORKER":
        return "👷";
      default:
        return "👤";
    }
  };

  return (
    <Card>
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-xl">{getRoleIcon(member.role)}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-gray-900 truncate">{member.name}</h3>
            <div className="flex space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                {member.role}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.status)}`}>
                {member.status}
              </span>
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-1">{member.email}</div>

          <div className="text-xs text-gray-500">Joined {new Date(member.joinedAt).toLocaleDateString()}</div>
        </div>
      </div>
    </Card>
  );
}

function RolePermissionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Permissions</CardTitle>
      </CardHeader>
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <span className="text-lg">👑</span>
          <div>
            <div className="font-medium text-gray-900">Owner</div>
            <div className="text-sm text-gray-600">Full access to all features, member management, and settings</div>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <span className="text-lg">👨‍💼</span>
          <div>
            <div className="font-medium text-gray-900">Associate</div>
            <div className="text-sm text-gray-600">Can read, create, and edit animals, events, and expenses</div>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <span className="text-lg">👷</span>
          <div>
            <div className="font-medium text-gray-900">Worker</div>
            <div className="text-sm text-gray-600">Can create events and expenses, read data (no settings access)</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function MembersPage() {
  // Mock current user role - in real app, get from auth context
  const currentUserRole = "OWNER";
  const canManageMembers = currentUserRole === "OWNER";

  return (
    <MobileLayout
      title="Farm Members"
      actions={
        canManageMembers ? (
          <Link href="/members/invite">
            <Button size="sm">Invite Member</Button>
          </Link>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {/* Members List */}
        <div className="space-y-3">
          {mockMembers.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>

        {/* Role Permissions Info */}
        <RolePermissionsCard />

        {/* Management Actions (Owner only) */}
        {canManageMembers && (
          <Card>
            <CardHeader>
              <CardTitle>Member Management</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              <Link href="/members/invite">
                <Button fullWidth variant="primary">
                  Invite New Member
                </Button>
              </Link>
              <Link href="/members/pending">
                <Button fullWidth variant="secondary">
                  View Pending Invitations
                </Button>
              </Link>
              <Link href="/members/audit">
                <Button fullWidth variant="ghost">
                  View Activity Log
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* No Management Access */}
        {!canManageMembers && (
          <Card>
            <div className="text-center py-6">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="font-medium text-gray-900 mb-2">Limited Access</h3>
              <p className="text-sm text-gray-600">Only farm owners can manage members and invitations.</p>
            </div>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
}
