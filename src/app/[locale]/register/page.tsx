"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LanguageSelector } from "@/components/ui/LanguageSelector";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const { register, isAuthenticated } = useAuth();
  const router = useRouter();
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tForms = useTranslations("forms");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const validateForm = () => {
    let isValid = true;
    setEmailError("");
    setNameError("");
    setPasswordError("");
    setConfirmPasswordError("");

    if (!email) {
      setEmailError(t("emailRequired"));
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError(tForms("invalidEmail"));
      isValid = false;
    }

    if (!name.trim()) {
      setNameError(tForms("fieldRequired"));
      isValid = false;
    }

    if (!password) {
      setPasswordError(t("passwordRequired"));
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError(tForms("minLength").replace("{min}", "8"));
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError(tForms("fieldRequired"));
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError(t("passwordMismatch"));
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await register(email, name.trim(), password);

      if (result.success) {
        router.push("/onboarding");
      } else {
        setError(result.error || tErrors("generic"));
      }
    } catch (err) {
      setError(tErrors("networkError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-center text-3xl font-bold text-gray-900">{t("register")}</h2>
          <LanguageSelector />
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Input
              label={t("email")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
              fullWidth
              autoComplete="email"
              autoFocus
              disabled={isLoading}
            />

            <Input
              label="Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={nameError}
              fullWidth
              autoComplete="name"
              disabled={isLoading}
            />

            <Input
              label={t("password")}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={passwordError}
              fullWidth
              autoComplete="new-password"
              disabled={isLoading}
            />

            <Input
              label={t("confirmPassword")}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={confirmPasswordError}
              fullWidth
              autoComplete="new-password"
              disabled={isLoading}
            />

            <Button type="submit" fullWidth disabled={isLoading} className="relative">
              {isLoading ? (
                <>
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  </div>
                  <span className="opacity-0">{t("registerButton")}</span>
                </>
              ) : (
                t("registerButton")
              )}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{tCommon("or")}</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <span className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  {t("login")}
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
