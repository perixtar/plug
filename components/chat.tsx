import { Message } from "@/lib/messages";
import { CodeArtifact } from "@/lib/schema";
import { DeploymentResult } from "@/lib/types";
import { DeepPartial } from "ai";
import { motion, type Variants } from "framer-motion";
import {
  LoaderIcon,
  Terminal,
  UserRound,
  Lightbulb,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useEffect } from "react";

// ---- helpers ---------------------------------------------------------------

// Only show artifact when there is code
const doShowArtifact = (msg: Message): boolean =>
  Array.isArray(msg.codeArtifact?.code) && msg.codeArtifact.code.length > 0;

// Framer Motion v11 easing (bezier arrays for typing safety)
const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const EASE_IN_OUT = [0.45, 0, 0.55, 1] as const;

const msgVariants: Variants = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.24, ease: EASE_OUT },
  },
  exit: { opacity: 0, y: 6, transition: { duration: 0.16, ease: EASE_OUT } },
};

// tiny typing dots
const Dot = ({ delay = 0 }) => (
  <motion.span
    className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/80"
    animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
    transition={{ duration: 0.9, repeat: Infinity, ease: EASE_IN_OUT, delay }}
  />
);

// brand styles
const BRAND_GRADIENT =
  "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-400";

// ---- component -------------------------------------------------------------

export function Chat({
  messages,
  isLoading,
  setCurrentPreview,
}: {
  messages: Message[];
  isLoading: boolean;
  setCurrentPreview: (preview: {
    code_artifact: DeepPartial<CodeArtifact> | undefined;
    deploymentResult: DeploymentResult | undefined;
  }) => void;
}) {
  useEffect(() => {
    const chatContainer = document.getElementById("chat-container");
    if (chatContainer) {
      chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [JSON.stringify(messages)]);

  return (
    <div
      id="chat-container"
      className="relative flex max-h-full flex-col gap-3 overflow-y-auto p-4 pb-20"
    >
      {/* slim top progress while generating */}
      {isLoading && (
        <div className="pointer-events-none sticky top-0 z-10 -mx-4 mb-1 h-0.5">
          <motion.div
            className="h-full w-1/3 rounded-r bg-gradient-to-r from-primary/0 via-primary to-primary/0"
            initial={{ x: "-33%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.2, repeat: Infinity, ease: EASE_IN_OUT }}
          />
        </div>
      )}

      {/* empty state */}
      {messages.length === 0 && !isLoading && (
        <div className="mt-24 flex items-center justify-center">
          <div className="rounded-2xl border bg-card/60 px-5 py-4 text-center text-muted-foreground shadow-sm backdrop-blur">
            <div
              className={`mx-auto mb-2 h-8 w-8 rounded-lg ${BRAND_GRADIENT}`}
            />
            <div className="text-sm">Build the first page of your app</div>
          </div>
        </div>
      )}

      {/* stream of messages, centered column like the reference */}
      <motion.div
        layout
        className="mx-auto flex w-full max-w-3xl flex-col gap-4"
      >
        {messages.map((message: Message, index: number) => {
          const isUser = message.role === "user";

          // shells (Lovable-like: user bubble vs assistant card)
          const userBubble =
            "self-end max-w-[82%] rounded-2xl bg-primary/5 dark:bg-primary/15 px-3 py-2 text-foreground/90 shadow-sm";
          const toolmindCard =
            "w-full rounded-2xl border bg-card/75 text-card-foreground backdrop-blur px-5 py-4 shadow-sm";

          return (
            <motion.div
              key={index}
              variants={msgVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={isUser ? userBubble : toolmindCard}
            >
              {/* header row */}
              <div className=" flex items-center gap-2 text-xs text-muted-foreground">
                {!isUser && (
                  <span className="mb-2">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-md ${BRAND_GRADIENT}`}
                      >
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                      </span>
                      <span className="font-medium text-foreground">Plug</span>
                    </span>
                    <span className="mx-1 text-muted-foreground/60">•</span>
                    <span className="inline-flex items-center gap-1">
                      <Lightbulb className="h-3.5 w-3.5" />
                      <span>Thoughtfully composed</span>
                    </span>
                  </span>
                )}
              </div>

              {/* body */}
              <div className="space-y-3 text-[0.9rem] leading-7">
                {message.content.map((content, id) => {
                  if (content.type === "text") {
                    return (
                      <p key={id} className="whitespace-pre-line">
                        {content.text}
                      </p>
                    );
                  }
                  if (content.type === "image") {
                    return (
                      <img
                        key={id}
                        src={content.image}
                        alt="fragment"
                        className="mb-2 inline-block h-14 w-14 rounded-xl bg-white object-cover ring-1 ring-black/5 dark:ring-white/10"
                      />
                    );
                  }
                  return null;
                })}
              </div>

              {/* artifact preview (unchanged behavior, refined style) */}
              {!isUser && doShowArtifact(message) && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.995 }}
                  onClick={() =>
                    setCurrentPreview({
                      code_artifact: message.codeArtifact,
                      deploymentResult: message.deploymentResult,
                    })
                  }
                  className="mt-4 inline-flex w-full items-center gap-3 rounded-xl border bg-background/60 p-2 pr-3 text-left ring-1 ring-inset ring-transparent transition-all hover:border-primary/30 hover:ring-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:w-max"
                >
                  <span className="pointer-events-none absolute inset-0 -z-10 rounded-xl opacity-0 blur-xl transition-opacity hover:opacity-50 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5">
                    <Terminal
                      strokeWidth={2}
                      className="text-muted-foreground"
                    />
                  </span>
                  <span className="flex min-w-[10rem] flex-col pr-1">
                    <span className="truncate text-sm font-semibold text-primary">
                      {message.codeArtifact?.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Click to view
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </motion.button>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Toolmind typing card (Lovable-style) */}
      {isLoading && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto w-full max-w-3xl rounded-2xl border bg-card/75 px-5 py-4 shadow-sm backdrop-blur"
        >
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-md ${BRAND_GRADIENT}`}
            >
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </span>
            <span className="font-medium text-foreground">Plug</span>
            <span className="text-muted-foreground/60">•</span>
            <Lightbulb className="h-4 w-4" />
            <span>Thinking</span>
            <div className="ml-1 inline-flex items-center gap-1">
              <Dot />
              <Dot delay={0.2} />
              <Dot delay={0.4} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-[86%] rounded bg-muted/60 animate-pulse" />
            <div className="h-3 w-[74%] rounded bg-muted/50 animate-pulse" />
            <div className="h-3 w-[62%] rounded bg-muted/40 animate-pulse" />
          </div>
          <div className="mt-3 inline-flex items-center gap-3 rounded-xl border bg-background/60 p-2 pr-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5" />
            <span className="h-3 w-28 rounded bg-muted/50 animate-pulse" />
          </div>
        </motion.div>
      )}
    </div>
  );
}
