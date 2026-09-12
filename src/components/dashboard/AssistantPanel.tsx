import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAction, useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import {
  Eraser,
  Send,
  Sparkles,
  SquarePen,
} from "lucide-react";

const SUGGESTIONS = [
  "¿Qué tiempo hace en Lima?",
  "¿Cuánto mide y pesa Charizard?",
  "¿Lloverá mañana en Bogotá?",
  "Háblame de Gengar",
];

interface ChatMsg {
  _id: string;
  role: "user" | "bot";
  content: string;
}

export function AssistantPanel() {
  const chat = useQuery(api.pokeclima.listChat, {}) as ChatMsg[] | undefined;
  const addMessage = useMutation(api.pokeclima.addChatMessage);
  const clearChat = useMutation(api.pokeclima.clearChat);
  const askAction = useAction(api.assistant.ask);

  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const messages = [...(chat ?? [])].reverse(); // listChat returns desc → display asc

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat?.length, asking]);

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || asking) return;
    if (text.length > 400) {
      toast.error("Máximo 400 caracteres.");
      return;
    }
    setInput("");
    setAsking(true);
    try {
      await addMessage({ role: "user", content: text });
      const answer = await askAction({ question: text });
      await addMessage({ role: "bot", content: answer });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error del asistente";
      toast.error("El asistente no pudo responder", { description: msg });
      try {
        await addMessage({
          role: "bot",
          content: "Lo siento, ahora mismo no puedo consultar los datos. Inténtalo de nuevo en un momento.",
        });
      } catch {
        /* ignore */
      }
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-11rem)] max-h-[720px] min-h-[440px] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border/70 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold">Asistente Pokéclima</h3>
            <p className="text-[11px] text-muted-foreground">
              Clima y Pokémon en vivo, respondidos con IA
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer gap-1.5 text-muted-foreground"
            onClick={() => {
              void clearChat();
              toast("Conversación borrada");
            }}
            disabled={asking || !chat?.length}
          >
            <Eraser className="size-3.5" /> Limpiar
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer text-muted-foreground"
            title="Nueva conversación"
            onClick={() => {
              void clearChat();
              setInput("");
            }}
            disabled={asking}
          >
            <SquarePen className="size-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {chat === undefined && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Cargando conversación…
          </div>
        )}

        {chat?.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-6" />
            </div>
            <div>
              <p className="font-display text-lg font-bold">Pregúntame lo que sea</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Combino datos en vivo de Open-Meteo y PokéAPI para responder en español.
              </p>
            </div>
            <div className="flex max-w-md flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="cursor-pointer rounded-full border border-border/80 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <motion.div
            key={m._id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-6",
                m.role === "user"
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md bg-secondary text-secondary-foreground",
              )}
            >
              {m.content}
            </div>
          </motion.div>
        ))}

        {asking && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-secondary px-4 py-3">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="size-1.5 rounded-full bg-muted-foreground/60"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border/60 p-3">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Ej.: ¿Qué tiempo hace en Madrid? · ¿Cuánto mide Pikachu?"
            maxLength={400}
            disabled={asking}
          />
          <Button
            size="icon"
            className="shrink-0 cursor-pointer"
            onClick={() => void send()}
            disabled={asking || !input.trim()}
            aria-label="Enviar"
          >
            <Send className="size-4" />
          </Button>
        </div>
        <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">
          {input.length}/400 · los datos se consultan en vivo al enviar
        </p>
      </div>
    </div>
  );
}
