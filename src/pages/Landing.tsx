import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { PokeclimaLogo } from "@/components/PokeclimaLogo";
import { TypeBadge } from "@/components/pokemon/TypeBadge";
import { WeatherIcon } from "@/components/weather/WeatherIcon";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CloudSun,
  Compass,
  FlaskConical,
  Github,
  Heart,
  LayoutDashboard,
  MapPin,
  Sparkles,
  Wand2,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
} as const;

export default function Landing() {
  const { isLoading, isAuthenticated } = useAuth();
  const dashboardHref = "/dashboard";

  const primaryCta = {
    href: isAuthenticated ? dashboardHref : "/auth",
    label: isAuthenticated ? "Ir al dashboard" : "Empezar gratis",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-background text-foreground"
    >
      {/* ---------------- Navbar ---------------- */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2.5">
            <PokeclimaLogo />
            <span className="font-display text-lg font-extrabold tracking-tight">Pokéclima</span>
          </a>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#apis" className="transition-colors hover:text-foreground">APIs</a>
            <a href="#lab" className="transition-colors hover:text-foreground">Constructor</a>
            <a href="#como" className="transition-colors hover:text-foreground">Cómo funciona</a>
          </nav>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="h-9 w-24 rounded-lg bg-muted" />
            ) : (
              <>
                {!isAuthenticated && (
                  <Button variant="ghost" className="cursor-pointer" asChild>
                    <a href="/auth">Iniciar sesión</a>
                  </Button>
                )}
                <Button className="cursor-pointer gap-1.5" asChild>
                  <a href={primaryCta.href}>
                    {primaryCta.label}
                    <ArrowRight className="size-4" />
                  </a>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* ---------------- Hero ---------------- */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_50%_-10%,--theme(--color-primary/12%),transparent)]"
          />
          <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-24">
            <div className="mx-auto max-w-3xl text-center">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Open-Meteo + PokéAPI · sin claves, sin coste
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
                className="font-display text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl"
              >
                El clima del mundo y tu propia{" "}
                <span className="text-primary">Pokédex</span>, en una sola app
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
                className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg"
              >
                Pokéclima consume dos APIs en vivo —predicción meteorológica global y
                toda la Pokédex— y añade un <strong className="text-foreground">Constructor</strong>{" "}
                para consultar varias APIs de Pokémon a la vez o crear especies nuevas por fusión.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
                className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
              >
                <Button size="lg" className="cursor-pointer gap-2" asChild>
                  <a href={primaryCta.href}>
                    {primaryCta.label}
                    <ArrowRight className="size-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="cursor-pointer gap-2" asChild>
                  <a href="#lab">
                    <FlaskConical className="size-4" />
                    Ver el Constructor
                  </a>
                </Button>
              </motion.div>
            </div>

            {/* Hero visual: weather card + fusion card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-2"
            >
              <div className="rounded-2xl border border-border/70 bg-card p-5 text-left">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <MapPin className="size-3.5" /> Madrid, España
                  </span>
                  <CloudSun className="size-5 text-primary" />
                </div>
                <div className="mt-3 flex items-end gap-3">
                  <span className="font-display text-5xl font-extrabold tracking-tighter">21°</span>
                  <span className="pb-1.5 text-sm text-muted-foreground">Parcialmente nublado</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  {[
                    ["Lluvia", "10%"],
                    ["Viento", "12 km/h"],
                    ["Humedad", "48%"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-secondary/70 px-2 py-2">
                      <p className="text-muted-foreground">{k}</p>
                      <p className="mt-0.5 font-semibold tabular-nums">{v}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Predicción de 7 días en vivo · Open-Meteo
                </p>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Constructor · fusión</span>
                  <Wand2 className="size-5 text-primary" />
                </div>
                <div className="mt-3 flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png"
                    alt="Gengar"
                    className="size-20 object-contain"
                  />
                  <span className="font-display text-xl font-bold text-muted-foreground">+</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/65.png"
                    alt="Alakazam"
                    className="size-20 object-contain"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="font-display text-lg font-extrabold">Gengazam</span>
                  <TypeBadge type="ghost" />
                  <TypeBadge type="psychic" />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Stats fusionados, IVs aleatorios y movimientos de ambas especies.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ---------------- APIs ---------------- */}
        <section id="apis" className="border-t border-border/60 bg-card/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Dos APIs, un panel</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Todo lo que pediste, ya conectado
              </h2>
              <p className="mt-3 text-muted-foreground">
                Una capa de servicios limpia por API —fácil de portar a Flutter con dio—
                y una interfaz que une ambas en la misma experiencia.
              </p>
            </motion.div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <motion.div
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="rounded-2xl border border-border/70 bg-card p-6"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CloudSun className="size-5" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold tracking-tight">API del clima</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Búsqueda de ciudades con geocodificación, condiciones actuales,
                  sensación térmica, viento, amanecer/atardecer y 7 días de predicción.
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {[
                    "Geocodificación multi-idioma",
                    "Códigos WMO traducidos al español",
                    "Ciudades favoritas guardadas",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-muted-foreground">
                      <span className="size-1.5 rounded-full bg-primary" /> {f}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.12 }}
                className="rounded-2xl border border-border/70 bg-card p-6"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Compass className="size-5" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold tracking-tight">API de Pokémon</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Cliente sobre PokéAPI con endpoints encadenables: especies, tipos,
                  habilidades, generaciones, movimientos y hasta 1 025 criaturas.
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {[
                    "Consulta por nombre, número o tipo",
                    "Aleatorios por habilidad o generación",
                    "Sprites oficiales y variocolor",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-muted-foreground">
                      <span className="size-1.5 rounded-full bg-primary" /> {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ---------------- Constructor ---------------- */}
        <section id="lab" className="border-t border-border/60">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">El Constructor</p>
                <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Un builder que consulta varias APIs… o inventa Pokémon nuevos
                </h2>
                <p className="mt-3 leading-7 text-muted-foreground">
                  La clase <code className="rounded bg-secondary px-1.5 py-0.5 text-sm font-semibold">PokemonConstructor</code>{" "}
                  encadena origen + modificadores y resuelve la llamada por ti.
                  Elige entre siete orígenes de consulta, y si te atreves, fusiona dos
                  especies en una creación inédita.
                </p>
                <div className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
                  {[
                    ["Por nombre o número", "Flujo clásico de Pokédex"],
                    ["Aleatorio por tipo", "El tipo manda, el resto es sorpresa"],
                    ["Por habilidad o generación", "Explora por características"],
                    ["Fusión de dos especies", "Stats, tipos y movimientos combinados"],
                  ].map(([t, d]) => (
                    <div key={t} className="rounded-xl border border-border/60 px-3 py-2.5">
                      <p className="font-semibold">{t}</p>
                      <p className="text-xs text-muted-foreground">{d}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="overflow-hidden rounded-2xl border border-border/70 bg-card"
              >
                <div className="border-b border-border/60 px-4 py-2.5 text-xs font-medium text-muted-foreground">
                  ejemplo · builder encadenado
                </div>
                <pre className="overflow-x-auto p-4 text-[12.5px] leading-6"><code>{`const fusion = await new PokemonConstructor(api)
  .hybrid("gengar", "alakazam")
  .level(72)
  .shiny()
  .withMoves(["shadow-ball", "psychic"])
  .build();`}</code></pre>
                <div className="border-t border-border/60 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Sparkles className="size-4 text-amber-500" />
                    <span className="font-semibold">Resultado:</span>
                    <span>Gengazam · Nv. 72 · Variocolor</span>
                    <TypeBadge type="ghost" />
                    <TypeBadge type="psychic" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ---------------- Cómo funciona ---------------- */}
        <section id="como" className="border-t border-border/60 bg-card/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Cómo funciona</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Tres pasos, cero configuración
              </h2>
            </motion.div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: "1",
                  title: "Crea tu sesión",
                  body: "Entra con tu email o como invitado. Tu Pokédex personal y tus ciudades quedan guardadas.",
                },
                {
                  icon: "2",
                  title: "Consulta el clima",
                  body: "Busca cualquier ciudad del mundo y guarda tus favoritas con predicción a 7 días.",
                },
                {
                  icon: "3",
                  title: "Construye Pokémon",
                  body: "Consulta la Pokédex o usa el Constructor para crear fusiones con IVs, nivel y movimientos.",
                },
              ].map((s, i) => (
                <motion.div
                  key={s.title}
                  {...fadeUp}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="rounded-2xl border border-border/70 bg-card p-6"
                >
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 font-display text-sm font-extrabold text-primary">
                    {s.icon}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{s.body}</p>
                </motion.div>
              ))}
            </div>

            <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["1 025", "especies en PokéAPI"],
                ["7 días", "de predicción por ciudad"],
                ["0 €", "sin claves ni cuotas"],
              ].map(([v, k]) => (
                <div key={k} className="rounded-2xl border border-border/70 bg-card px-6 py-5 text-center">
                  <p className="font-display text-3xl font-extrabold tracking-tight text-primary">{v}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{k}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ---------------- CTA final ---------------- */}
        <section className="border-t border-border/60">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.4 }}
              className="mx-auto max-w-2xl text-center"
            >
              <WeatherIcon name="cloud-sun" className="mx-auto size-12 text-primary" />
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                ¿Lista tu ruta? ¿Lista tu Pokédex?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                Entra gratis y empieza a explorar el clima del mundo y todas las
                criaturas que PokéAPI puede darte.
              </p>
              <div className="mt-8">
                <Button size="lg" className="cursor-pointer gap-2" asChild>
                  <a href={primaryCta.href}>
                    {primaryCta.label}
                    <ArrowRight className="size-4" />
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ---------------- Footer ---------------- */}
      <footer className="border-t border-border/60">
        <div className={cn("mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6")}>
          <div className="flex items-center gap-2.5">
            <PokeclimaLogo className="size-8" />
            <div>
              <p className="text-sm font-semibold">Pokéclima</p>
              <p className="text-xs text-muted-foreground">Clima × Pokémon, en vivo</p>
            </div>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Datos de
            <a
              href="https://open-meteo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline hover:text-foreground"
            >
              Open-Meteo
            </a>
            y
            <a
              href="https://pokeapi.co"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline hover:text-foreground"
            >
              PokéAPI
            </a>
            · hecho con <Heart className="size-3 text-red-500" />
          </p>
          <div className="flex items-center gap-3 text-muted-foreground">
            <a href="/auth" className="text-xs font-medium hover:text-foreground">Entrar</a>
            <span className="opacity-40">·</span>
            <a href="/dashboard" className="text-xs font-medium hover:text-foreground">Dashboard</a>
            <span className="opacity-40">·</span>
            <Github className="size-4" />
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
