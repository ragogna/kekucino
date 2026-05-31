"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { RobotChefIcon } from "@/components/RobotChefIcon";
import { APP_VERSION } from "@/lib/utils";
import { toast } from "sonner";

export default function LandingPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/cucina");
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
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(160deg, #1a0500 0%, #3d1200 60%, #0f0400 100%)" }}
      >
        <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
             style={{ borderColor: "#f59e0b", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #1a0500 0%, #3d1200 45%, #0f0500 100%)" }}
    >
      {/* Ambient glow blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #d97706 0%, transparent 65%)" }}
        />
        <div
          className="absolute bottom-1/4 -left-24 w-72 h-72 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #b45309 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/3 -right-12 w-56 h-56 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #f59e0b 0%, transparent 70%)" }}
        />
      </div>

      {/* Decorative food emojis */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        <span className="absolute text-7xl top-[7%] left-[4%] rotate-[-15deg]" style={{ opacity: 0.07 }}>🍝</span>
        <span className="absolute text-6xl top-[13%] right-[6%] rotate-[10deg]" style={{ opacity: 0.06 }}>🧀</span>
        <span className="absolute text-5xl top-[34%] left-[2%] rotate-[-20deg]" style={{ opacity: 0.05 }}>🥩</span>
        <span className="absolute text-6xl top-[46%] right-[4%] rotate-[15deg]" style={{ opacity: 0.07 }}>🫒</span>
        <span className="absolute text-5xl bottom-[32%] left-[7%] rotate-[-10deg]" style={{ opacity: 0.06 }}>🥗</span>
        <span className="absolute text-6xl bottom-[18%] right-[8%] rotate-[20deg]" style={{ opacity: 0.07 }}>🍷</span>
        <span className="absolute text-4xl bottom-[42%] left-[42%] rotate-[5deg]" style={{ opacity: 0.05 }}>🫑</span>
      </div>

      {/* Version badge */}
      <div className="absolute top-4 right-4 z-10">
        <span
          className="text-xs font-mono px-2.5 py-1 rounded-full border"
          style={{ color: "rgba(251,191,36,0.7)", background: "rgba(251,191,36,0.08)", borderColor: "rgba(251,191,36,0.2)" }}
        >
          v{APP_VERSION}
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 relative z-10">

        {/* Logo with glow */}
        <div className="mb-8 float-animation">
          <div className="relative">
            <div
              className="absolute inset-0 blur-2xl scale-125 rounded-3xl glow-pulse"
              style={{ background: "linear-gradient(135deg, #d97706, #b45309)" }}
            />
            <div className="relative w-28 h-28 rounded-3xl flex items-center justify-center shadow-2xl chef-gradient">
              <RobotChefIcon size={68} />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold text-center mb-2" style={{ color: "#faf9f7" }}>
          Ke<span style={{ color: "#f59e0b" }}>Kucino</span>
        </h1>
        <p className="text-center text-lg mb-3" style={{ color: "rgba(250,249,247,0.65)" }}>
          Il tuo chef stellato personale
        </p>
        <div className="flex items-center gap-1.5 mb-10">
          {["★", "★", "★"].map((s, i) => (
            <span key={i} className="text-xl" style={{ color: "#f59e0b" }}>{s}</span>
          ))}
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-sm">
          {[
            { emoji: "📸", text: "Fotografa il frigo" },
            { emoji: "🤖", text: "AI riconosce tutto" },
            { emoji: "👨‍🍳", text: "Ricette al grammo" },
            { emoji: "💬", text: "Chiedi allo chef" },
          ].map(({ emoji, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm font-medium"
              style={{
                background: "rgba(255,255,255,0.08)",
                borderColor: "rgba(255,255,255,0.14)",
                color: "rgba(250,249,247,0.82)",
              }}
            >
              <span>{emoji}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleSignIn}
          className="w-full max-w-sm flex items-center justify-center gap-3 rounded-2xl py-4 px-6 font-semibold text-base transition-all active:scale-95 hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
            color: "white",
            boxShadow: "0 8px 32px rgba(217,119,6,0.45)",
          }}
        >
          <GoogleIcon />
          Accedi con Google
        </button>

        <p className="mt-5 text-xs text-center max-w-xs" style={{ color: "rgba(250,249,247,0.35)" }}>
          Accedendo accetti i nostri termini di servizio.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
