"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth/context";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberAdded: () => void;
}

export function AddMemberModal({ isOpen, onClose, onMemberAdded }: AddMemberModalProps) {
  const { farm } = useAuth();
  const t = useTranslations("members");
  const tCommon = useTranslations("common");
  const tForms = useTranslations("forms");

  const [formData, setFormData] = useState({
    email: "",
    role: "WORKER" as "OWNER" | "ASSOCIATE" | "WORKER",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const roleOptions = [
    { value: "OWNER", label: t("roles.owner.title") },
    { value: "ASSOCIATE", label: t("roles.associate.title") },
    { value: "WORKER", label: t("roles.worker.title") },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farm) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/farms/${farm.id}/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setFormData({ email: "", role: "WORKER" });
        onMemberAdded();
        onClose();

        // Show invitation link for testing (in production, this would be sent by email)
        if (data.data.invitationLink) {
          alert(`Invitation envoyée ! Lien d'invitation (pour test) : ${data.data.invitationLink}`);
        }
      } else {
        setError(data.error || tCommon("error"));
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      setError(tCommon("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t("inviteNewMember")}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={isSubmitting}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={`${tForms("email")} *`}
              type="email"
              placeholder="exemple@email.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              fullWidth
              required
            />

            <Select
              label={`${t("role")} *`}
              options={roleOptions}
              value={formData.role}
              onChange={(e) => handleChange("role", e.target.value)}
              fullWidth
              required
            />

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p className="font-medium mb-2">Rôles :</p>
              <ul className="space-y-1 text-xs">
                <li>
                  <strong>Propriétaire :</strong> {t("roles.owner.description")}
                </li>
                <li>
                  <strong>Associé :</strong> {t("roles.associate.description")}
                </li>
                <li>
                  <strong>Ouvrier :</strong> {t("roles.worker.description")}
                </li>
              </ul>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={onClose} fullWidth disabled={isSubmitting}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" fullWidth disabled={isSubmitting || !formData.email}>
                {isSubmitting ? "Ajout en cours..." : t("inviteMember")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
