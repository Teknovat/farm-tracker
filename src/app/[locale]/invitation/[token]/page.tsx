"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useTranslations } from "next-intl";

interface InvitationDetails {
  farmName: string;
  role: string;
  inviterName: string;
  email: string;
}

interface InvitationPageProps {
  params: Promise<{ token: string; locale: string }>;
}

export default function InvitationPage({ params }: InvitationPageProps) {
  const router = useRouter();
  const t = useTranslations("members");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");

  const [token, setToken] = useState<string>("");
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [userExists, setUserExists] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    password: "",
  });

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setToken(resolvedParams.token);
      fetchInvitation(resolvedParams.token);
    };
    loadParams();
  }, [params]);

  const fetchInvitation = async (invitationToken: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationToken}`);
      const data = await response.json();

      if (data.success) {
        setInvitation(data.data.invitation);
        setUserExists(data.data.userExists);
      } else {
        setError(data.error || "Invitation invalide");
      }
    } catch (error) {
      console.error("Error fetching invitation:", error);
      setError("Erreur lors du chargement de l'invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/invitations/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Invitation acceptée avec succès ! Vous pouvez maintenant vous connecter.");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } else {
        setError(data.error || "Erreur lors de l'acceptation de l'invitation");
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-gray-500">{tCommon("loading")}</div>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center py-8">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Invitation invalide</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push("/auth/login")}>Aller à la connexion</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center py-8">
            <div className="text-green-500 text-4xl mb-4">✅</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Invitation acceptée !</h1>
            <p className="text-gray-600 mb-4">{success}</p>
            <Button onClick={() => router.push("/auth/login")}>Se connecter maintenant</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-blue-500 text-4xl mb-4">🏡</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Invitation à rejoindre une ferme</h1>
            {invitation && (
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Ferme :</strong> {invitation.farmName}
                </p>
                <p>
                  <strong>Rôle :</strong> {invitation.role}
                </p>
                <p>
                  <strong>Invité par :</strong> {invitation.inviterName}
                </p>
                <p>
                  <strong>Email :</strong> {invitation.email}
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
          )}

          {userExists ? (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Vous avez déjà un compte avec cet email. L'invitation sera automatiquement acceptée.
              </p>
              <Button onClick={handleSubmit} disabled={isSubmitting} fullWidth>
                {isSubmitting ? "Acceptation..." : "Accepter l'invitation"}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-gray-600 text-sm mb-4">Créez votre compte pour rejoindre la ferme :</p>

              <Input
                label={`${tAuth("name")} *`}
                placeholder="Votre nom complet"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                fullWidth
                required
              />

              <Input
                label={`${tAuth("password")} *`}
                type="password"
                placeholder="Choisissez un mot de passe"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                fullWidth
                required
              />

              <Button type="submit" fullWidth disabled={isSubmitting || !formData.name || !formData.password}>
                {isSubmitting ? "Création du compte..." : "Créer mon compte et rejoindre"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Button variant="secondary" onClick={() => router.push("/auth/login")}>
              Retour à la connexion
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
