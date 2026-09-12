import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { WeatherPanel } from "@/components/dashboard/WeatherPanel";
import { PokemonExplorer } from "@/components/dashboard/PokemonExplorer";
import { PokemonLab } from "@/components/dashboard/PokemonLab";
import { AssistantPanel } from "@/components/dashboard/AssistantPanel";
import { PokeclimaLogo } from "@/components/PokeclimaLogo";
import { cn } from "@/lib/utils";
import {
  Compass,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Sparkles,
} from "lucide-react";

const NAV = [
  { id: "weather", label: "Clima", icon: LayoutDashboard },
  { id: "explorer", label: "Explorar Pokémon", icon: Compass },
  { id: "lab", label: "Constructor Lab", icon: FlaskConical },
  { id: "assistant", label: "Asistente IA", icon: Sparkles },
] as const;

type ViewId = (typeof NAV)[number]["id"];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [view, setView] = useState<ViewId>("weather");
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 lg:px-8">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-6 hidden h-fit w-56 shrink-0 flex-col gap-1 lg:flex">
          <a href="/" className="mb-4 flex items-center gap-2.5 px-2">
            <PokeclimaLogo />
            <span className="font-display text-lg font-extrabold tracking-tight">Pokéclima</span>
          </a>
          {NAV.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
                {active && (
                  <motion.span
                    layoutId="dash-nav"
                    className="ml-auto size-1.5 rounded-full bg-primary"
                  />
                )}
              </button>
            );
          })}

          <div className="mt-4 rounded-xl border border-border/70 p-3">
            <p className="truncate text-sm font-semibold">
              {user?.name ?? user?.email ?? "Entrenador"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {user?.isAnonymous ? "Sesión de invitado" : user?.email ?? ""}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full cursor-pointer gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="size-3.5" /> Salir
            </Button>
          </div>
        </aside>

        {/* Main column */}
        <div className="min-w-0 flex-1">
          {/* Mobile header */}
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <a href="/" className="flex items-center gap-2">
              <PokeclimaLogo className="size-8" />
              <span className="font-display text-lg font-extrabold tracking-tight">Pokéclima</span>
            </a>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer gap-2"
              onClick={() => setMobileNavOpen((v) => !v)}
            >
              <LayoutDashboard className="size-3.5" /> Menú
            </Button>
          </div>
          {mobileNavOpen && (
            <div className="mb-4 grid grid-cols-2 gap-2 lg:hidden">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setView(item.id);
                    setMobileNavOpen(false);
                  }}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-medium",
                    view === item.id
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/70 text-muted-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="col-span-2 cursor-pointer gap-2"
                onClick={handleSignOut}
              >
                <LogOut className="size-3.5" /> Salir
              </Button>
            </div>
          )}

          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {view === "weather" && <WeatherPanel />}
            {view === "explorer" && <PokemonExplorer />}
            {view === "lab" && <PokemonLab />}
            {view === "assistant" && <AssistantPanel />}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
