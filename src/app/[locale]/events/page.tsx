"use client";

import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useTranslations } from "next-intl";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Link from "next/link";

function EventsContent() {
  const t = useTranslations("events");

  return (
    <MobileLayout
      title={t("title")}
      actions={
        <Link href="/events/new">
          <Button size="sm">{t("addEvent")}</Button>
        </Link>
      }
    >
      <Card>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t("noEvents")}</h3>
          <p className="text-gray-600 mb-4">Start by recording your first event.</p>
          <Link href="/events/new">
            <Button>{t("recordEvent")}</Button>
          </Link>
        </div>
      </Card>
    </MobileLayout>
  );
}

export default function EventsPage() {
  return (
    <ProtectedRoute>
      <EventsContent />
    </ProtectedRoute>
  );
}
