"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { clsx } from "clsx";

interface NavItem {
  href: string;
  labelKey: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: "🏠" },
  { href: "/animals", labelKey: "animals", icon: "🐄" },
  { href: "/events", labelKey: "events", icon: "📅" },
  { href: "/cashbox", labelKey: "cashbox", icon: "💰" },
  { href: "/members", labelKey: "members", icon: "👥" },
];

export function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations("navigation");

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center px-2 py-2 min-w-[60px]",
                "text-xs font-medium transition-colors",
                "min-h-[56px]", // Large touch target
                {
                  "text-blue-600": isActive,
                  "text-gray-600 hover:text-gray-900": !isActive,
                }
              )}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
