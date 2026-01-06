"use client";

import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AddMemberModal } from "@/components/members/AddMemberModal";
import { MemberCard } from "@/components/members/MemberCard";
import { useTranslations } from "next-intl";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/context";

interface Member {
  id: string;
  userId: string;
  role: "OWNER" | "ASSOCIATE" | "WORKER";
  status: "ACTIVE" | "INACTIVE";
  userName: string;
  userEmail: string;
  createdAt: string;
}

function MembersContent() {
  const t = useTranslations("members");
  const tCommon = useTranslations("common");
  const { user, farm } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [error, setError] = useState("");

  const isOwner = farm?.role === "OWNER";

  const fetchMembers = async () => {
    if (!farm) return;

    try {
      const response = await fetch(`/api/farms/${farm.id}/members`);
      const data = await response.json();

      if (data.success) {
        setMembers(data.data.members);
      } else {
        setError(data.error || tCommon("error"));
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      setError(tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [farm]);

  const handleMemberAdded = () => {
    fetchMembers();
  };

  const handleMemberUpdated = () => {
    fetchMembers();
  };

  const handleMemberRemoved = () => {
    fetchMembers();
  };

  if (isLoading) {
    return (
      <MobileLayout title={t("title")}>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">{tCommon("loading")}</div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      title={t("title")}
      actions={
        isOwner ? (
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            {t("inviteMember")}
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

        {!isOwner && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">{t("noPermission")}</p>
          </div>
        )}

        <div className="space-y-3">
          {members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onMemberUpdated={handleMemberUpdated}
              onMemberRemoved={handleMemberRemoved}
            />
          ))}
        </div>

        {members.length === 0 && !error && (
          <Card>
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">👥</div>
              <p className="text-gray-500">Aucun membre trouvé</p>
              {isOwner && (
                <Button className="mt-4" onClick={() => setIsAddModalOpen(true)}>
                  {t("inviteNewMember")}
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onMemberAdded={handleMemberAdded}
      />
    </MobileLayout>
  );
}

export default function MembersPage() {
  return (
    <ProtectedRoute>
      <MembersContent />
    </ProtectedRoute>
  );
}
