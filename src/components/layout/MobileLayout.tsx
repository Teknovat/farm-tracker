import { clsx } from "clsx";
import { MobileNav } from "./MobileNav";
import { MobileHeader } from "./MobileHeader";

interface MobileLayoutProps {
  children: React.ReactNode;
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
  showNav?: boolean;
}

export function MobileLayout({
  children,
  title,
  showBack = false,
  onBack,
  actions,
  showNav = true,
}: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader title={title} showBack={showBack} onBack={onBack} actions={actions} />

      <main
        className={clsx(
          "px-4 py-4",
          showNav ? "pb-20" : "pb-4" // Add bottom padding for nav
        )}
      >
        {children}
      </main>

      {showNav && <MobileNav />}
    </div>
  );
}
