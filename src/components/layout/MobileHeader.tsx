"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export function MobileHeader({ title, showBack = false, onBack, actions }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 min-h-[56px]">
        <div className="flex items-center space-x-3">
          {showBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="p-2 min-h-[40px] min-w-[40px]">
              ←
            </Button>
          )}
          <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
        </div>
        {actions && <div className="flex items-center space-x-2">{actions}</div>}
      </div>
    </header>
  );
}
