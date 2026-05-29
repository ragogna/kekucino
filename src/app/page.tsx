"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, Camera, BookOpen, ChefHat } from "lucide-react";
import { RobotChefIcon } from "@/components/RobotChefIcon";
import { toast } from "sonner";

export default function LandingPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/cucina");
    }
  }, [user, loading, router]);

  async function handleSignIn() {
    try {
      await signInWithGoogle();
    } catch {
      toast.error("Accesso fallito. Riprova.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="mb-8 float-animation">
          <div className="w-24 h-24 chef-gradient rounded-3xl flex items-center justify-center shadow-2xl">
            <RobotChefIcon size={56} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-center mb-2 text-foreground">
          Ke<span className="text-primary">Kucino</span>
        </h1>
        <p className="text-muted-foreground text-center text-lg mb-2">
          Il tuo chef stellato personale
        </p>
        <div className="flex items-center gap-1 mb-10">
          {[...Array(3)].map((_, i) => (
            <Sparkles key={i} className="w-4 h-4 text-primary fill-primary" />
          ))}
        </div>

        {/* Features */}
        <div className="w-full max-w-sm space-y-4 mb-10">
          {[
            {
              icon: Camera,
              title: "Fotografa il tuo frigo",
              desc: "Una o più foto, anche in sequenza",
            },
            {
              icon: Sparkles,
              title: "AI riconosce gli ingredienti",
              desc: "Gemini analizza tutto automaticamente",
            },
            {
              icon: ChefHat,
              title: "Ricette da chef stellato",
              desc: "Istruzioni precise al grammo, sempre riuscite",
            },
            {
              icon: BookOpen,
              title: "Veloce, media o lunga",
              desc: "Scegli il tempo che hai a disposizione",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-4 food-card p-4">
              <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleSignIn}
          className="w-full max-w-sm flex items-center justify-center gap-3 bg-foreground text-background rounded-2xl py-4 px-6 font-semibold text-base transition-opacity hover:opacity-90 active:opacity-80 pulse-ring"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Accedi con Google
        </button>

        <p className="mt-6 text-xs text-muted-foreground text-center max-w-xs">
          Accedendo accetti i nostri termini di servizio. I tuoi dati non vengono condivisi con terze parti.
        </p>
      </div>
    </div>
  );
}
