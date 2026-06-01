"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Camera, BookOpen, LogOut, MessageCircle } from "lucide-react";
import { RobotChefIcon } from "@/components/RobotChefIcon";
import { useCookingStore } from "@/store/cooking";
import { APP_VERSION, formatCostEur } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

const navItems = [
  { href: "/cucina", icon: Camera, label: "Cucina" },
  { href: "/chat", icon: MessageCircle, label: "Chef" },
  { href: "/storia", icon: BookOpen, label: "Storia" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const totalCost = useCookingStore((s) => s.totalCost);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  async function handleSignOut() {
    try {
      await signOut();
      router.replace("/");
    } catch {
      toast.error("Errore nel logout");
    }
  }

  const costText = totalCost > 0 ? formatCostEur(totalCost) : null;

  return (
    <div className="min-h-screen flex flex-col bg-background pb-safe-bottom">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          <Link href="/cucina" className="flex items-center gap-2">
            <div className="w-8 h-8 chef-gradient rounded-xl flex items-center justify-center overflow-hidden">
              <RobotChefIcon size={28} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-foreground text-sm">
                Ke<span className="text-primary">Kucino</span>
              </span>
              <span className="text-[9px] text-muted-foreground font-mono">v{APP_VERSION}</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {costText && (
              <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                {costText}
              </span>
            )}
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName ?? ""}
                className="w-7 h-7 rounded-full ring-2 ring-primary/20"
              />
            )}
            <button
              onClick={handleSignOut}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Esci"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full">{children}</main>

      {/* Bottom nav */}
      <nav className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t border-border safe-bottom">
        <div className="flex max-w-lg mx-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "fill-primary/10" : ""}`} />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
