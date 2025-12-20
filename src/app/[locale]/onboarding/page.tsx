"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LanguageSelector } from "@/components/ui/LanguageSelector";

export default function OnboardingPage() {
  const [step, setStep] = useState<"welcome" | "create" | "join">("welcome");
  const [farmName, setFarmName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");

  const { user, farm, refreshSession } = useAuth();
  const router = useRouter();
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");

  // Redirect to dashboard if user already has a farm
  useEffect(() => {
    if (farm) {
      router.push("/dashboard");
    }
  }, [farm, router]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  const validateForm = () => {
    setNameError("");
    if (!farmName.trim()) {
      setNameError(t("farmNameRequired"));
      return false;
    }
    if (farmName.trim().length < 3) {
      setNameError(t("farmNameTooShort"));
      return false;
    }
    return true;
  };

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/farms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: farmName.trim(),
          currency: "TND",
          timezone: "Africa/Tunis",
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh session to get the new farm
        // The useEffect will automatically redirect to dashboard when farm is loaded
        await refreshSession();
      } else {
        setError(data.error || tErrors("generic"));
      }
    } catch (err) {
      setError(tErrors("networkError"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            {step === "welcome" && t("welcome")}
            {step === "create" && t("createFarm")}
            {step === "join" && t("joinFarm")}
          </h2>
          <LanguageSelector />
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          {step === "welcome" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <svg
                    className="h-10 w-10 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-lg text-gray-700 mb-2">
                  {t("welcomeMessage")}, {user.name}!
                </p>
                <p className="text-sm text-gray-500">{t("getStarted")}</p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => setStep("create")}
                  fullWidth
                  className="bg-green-600 hover:bg-green-700 text-white justify-center items-center gap-2"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  {t("createNewFarm")}
                </Button>

                <Button
                  onClick={() => setStep("join")}
                  fullWidth
                  variant="secondary"
                  className="justify-center items-center gap-2"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {t("joinExistingFarm")}
                </Button>
              </div>
            </div>
          )}

          {step === "create" && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">{t("createFarmDescription")}</p>
              </div>

              <form onSubmit={handleCreateFarm} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <Input
                  label={t("farmName")}
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  error={nameError}
                  fullWidth
                  autoFocus
                  disabled={isLoading}
                  placeholder={t("farmNamePlaceholder")}
                />

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    onClick={() => setStep("welcome")}
                    variant="secondary"
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {tCommon("back")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {tCommon("loading")}
                      </div>
                    ) : (
                      t("createFarmButton")
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {step === "join" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                  <svg
                    className="h-10 w-10 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-lg text-gray-700 mb-2">{t("noInvitations")}</p>
                <p className="text-sm text-gray-500">{t("checkEmail")}</p>
              </div>

              <Button
                onClick={() => setStep("welcome")}
                fullWidth
                variant="secondary"
              >
                {tCommon("back")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
