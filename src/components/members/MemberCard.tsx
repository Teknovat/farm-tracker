"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useTranslations } from "next-intl";
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

interface MemberCardProps {
  member: Member;
  onMemberUpdated: () => void;
  onMemberRemoved: () => void;
}

export function MemberCard({ member, onMemberUpdated, onMemberRemoved }: MemberCardProps) {
  const { farm, user } = useAuth();
  const t = useTranslations("members");
  const tCommon = useTranslations("common");

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    role: member.role,
    status: member.status,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const roleOptions = [
    { value: "OWNER", label: t("roles.owner.title") },
    { value: "ASSOCIATE", label: t("roles.associate.title") },
    { value: "WORKER", label: t("roles.worker.title") },
  ];

  const statusOptions = [
    { value: "ACTIVE", label: t("active") },
    { value: "INACTIVE", label: t("inactive") },
  ];

  const isCurrentUser = user?.id === member.userId;
  const canEdit = farm?.role === "OWNER" && !isCurrentUser;

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
    return status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const handleSave = async () => {
    if (!farm) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/farms/${farm.id}/members/${member.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editData),
      });

      const data = await response.json();

      if (data.success) {
        setIsEditing(false);
        onMemberUpdated();
      } else {
        setError(data.error || tCommon("error"));
      }
    } catch (error) {
      console.error("Error updating member:", error);
      setError(tCommon("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!farm || !confirm("Êtes-vous sûr de vouloir supprimer ce membre ?")) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/farms/${farm.id}/members/${member.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        onMemberRemoved();
      } else {
        setError(data.error || tCommon("error"));
      }
    } catch (error) {
      console.error("Error removing member:", error);
      setError(tCommon("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      role: member.role,
      status: member.status,
    });
    setIsEditing(false);
    setError("");
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm">{error}</div>
      )}

      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xl">👤</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 truncate">
                {member.userName}
                {isCurrentUser && <span className="text-sm text-gray-500 ml-2">(Vous)</span>}
              </h3>
              <p className="text-sm text-gray-500 truncate">{member.userEmail}</p>
            </div>

            {canEdit && (
              <div className="flex space-x-2">
                {!isEditing ? (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)} disabled={isSubmitting}>
                      {tCommon("edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleRemove}
                      disabled={isSubmitting}
                      className="text-red-600 hover:text-red-700"
                    >
                      {tCommon("delete")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" onClick={handleSave} disabled={isSubmitting}>
                      {tCommon("save")}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleCancel} disabled={isSubmitting}>
                      {tCommon("cancel")}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 space-y-2">
            {isEditing ? (
              <div className="space-y-3">
                <Select
                  label={t("role")}
                  options={roleOptions}
                  value={editData.role}
                  onChange={(e) => setEditData((prev) => ({ ...prev, role: e.target.value as any }))}
                  fullWidth
                />
                <Select
                  label={t("status")}
                  options={statusOptions}
                  value={editData.status}
                  onChange={(e) => setEditData((prev) => ({ ...prev, status: e.target.value as any }))}
                  fullWidth
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}
                >
                  {roleOptions.find((r) => r.value === member.role)?.label}
                </span>
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.status)}`}
                >
                  {statusOptions.find((s) => s.value === member.status)?.label}
                </span>
              </div>
            )}
          </div>

          <div className="mt-2 text-xs text-gray-500">
            {t("joinedAt")}: {new Date(member.createdAt).toLocaleDateString("fr-FR")}
          </div>
        </div>
      </div>
    </div>
  );
}
