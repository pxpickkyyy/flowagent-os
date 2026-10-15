import React, { useEffect, useLayoutEffect, useRef } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/* ────────────────────────────────────────────────────────────
 * Motion vocabulary
 * Entrances decelerate (out-expo), state moves glide (cinematic),
 * interactive surfaces use springs with real mass.
 * ──────────────────────────────────────────────────────────── */
export const EASE_CINEMATIC = [0.32, 0.72, 0, 1] as const;
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_QUART = [0.5, 0, 0.75, 0] as const;
export const SPRING_SOFT = { type: "spring", stiffness: 140, damping: 22, mass: 0.9 } as const;
export const SPRING_SNAPPY = { type: "spring", stiffness: 420, damping: 32, mass: 0.6 } as const;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ────────────────────────────────────────────────────────────
 * Double-Bezel card: machined outer tray + glass inner core,
 * with a cursor-tracked spotlight (CSS vars, no re-render).
 * ──────────────────────────────────────────────────────────── */
type Tone = "neutral" | "emerald" | "rose";

const SHELL_TONES: Record<Tone, string> = {
  neutral: "bg-white/[0.025] ring-white/[0.07]",
  emerald:
    "bg-emerald-400/[0.05] ring-emerald-300/20 shadow-[0_0_90px_-30px_rgba(52,211,153,0.45)]",
  rose: "bg-rose-500/[0.06] ring-rose-400/25 shadow-[0_0_90px_-30px_rgba(244,63,94,0.5)]",
};

const SPOT_TONES: Record<Tone, string> = {
  neutral: "rgba(255,255,255,0.055)",
  emerald: "rgba(52,211,153,0.09)",
  rose: "rgba(244,63,94,0.10)",
};

interface BezelProps {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  innerClassName?: string;
  id?: string;
}

export function Bezel({ children, tone = "neutral", className, innerClassName, id }: BezelProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div
      id={id}
      ref={ref}
      onPointerMove={handleMove}
      className={cn(
        "group/bezel relative rounded-[2rem] p-1.5 ring-1 transition-[box-shadow,background-color] duration-700 ease-cinematic",
        SHELL_TONES[tone],
        className,
      )}
    >
      <div
        className={cn(
          "relative h-full overflow-hidden rounded-[calc(2rem-0.375rem)] bg-[linear-gradient(180deg,#0E0E10_0%,#09090A_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.07),inset_0_0_0_1px_rgba(255,255,255,0.025)]",
          innerClassName,
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 ease-cinematic group-hover/bezel:opacity-100"
          style={{
            background: `radial-gradient(520px circle at var(--mx, 50%) var(--my, 0%), ${SPOT_TONES[tone]}, transparent 45%)`,
          }}
        />
        <div className="relative h-full">{children}</div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 * Eyebrow tag
 * ──────────────────────────────────────────────────────────── */
export function Eyebrow({
  children,
  pulse,
  tone = "emerald",
  className,
}: {
  children: React.ReactNode;
  pulse?: boolean;
  tone?: "emerald" | "rose" | "amber" | "neutral";
  className?: string;
}) {
  const dot = {
    emerald: "bg-emerald-400",
    rose: "bg-rose-400",
    amber: "bg-amber-300",
    neutral: "bg-white/50",
  }[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-white/[0.03] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/55 ring-1 ring-white/[0.08]",
        className,
      )}
    >
      {pulse !== undefined && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", dot)} />}
          <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", dot)} />
        </span>
      )}
      {children}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────
 * Island button — pill with nested trailing icon capsule,
 * magnetic pull toward the cursor and physical press.
 * ──────────────────────────────────────────────────────────── */
interface IslandButtonProps {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "light";
  size?: "md" | "lg";
  className?: string;
  title?: string;
  magnetic?: boolean;
}

export function IslandButton({
  children,
  icon,
  onClick,
  variant = "primary",
  size = "md",
  className,
  title,
  magnetic = true,
}: IslandButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.5 });

  const handleMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!magnetic || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.12);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.28);
  };
  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  const styles = {
    primary:
      "bg-emerald-400 text-[#022014] shadow-[0_0_0_1px_rgba(110,231,183,0.5),0_18px_50px_-18px_rgba(52,211,153,0.75),inset_0_1px_0_rgba(255,255,255,0.45)] hover:bg-emerald-300",
    light:
      "bg-stone-50 text-[#0A0A0A] shadow-[0_0_0_1px_rgba(255,255,255,0.6),0_18px_50px_-20px_rgba(255,255,255,0.35),inset_0_1px_0_rgba(255,255,255,1)] hover:bg-white",
    ghost:
      "bg-white/[0.04] text-white/90 ring-1 ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-white/[0.07] hover:text-white",
  }[variant];

  const capsule = {
    primary: "bg-[#022014]/10 text-[#022014]",
    light: "bg-black/[0.06] text-[#0A0A0A]",
    ghost: "bg-white/[0.08] text-white",
  }[variant];

  return (
    <motion.button
      ref={ref}
      type="button"
      title={title}
      onClick={onClick}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.975 }}
      transition={SPRING_SNAPPY}
      className={cn(
        "group relative inline-flex select-none items-center gap-3 rounded-full font-medium tracking-[-0.01em] transition-colors duration-500 ease-cinematic",
        size === "lg" ? "py-2 pl-7 pr-2 text-[15px]" : "py-1.5 pl-5 pr-1.5 text-[13px]",
        styles,
        className,
      )}
    >
      <span className="relative">{children}</span>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full transition-transform duration-500 ease-cinematic group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:scale-105",
          size === "lg" ? "h-10 w-10" : "h-8 w-8",
          capsule,
        )}
      >
        {icon}
      </span>
    </motion.button>
  );
}

/* ────────────────────────────────────────────────────────────
 * Scroll reveal — heavy fade-up resolving from blur.
 * ──────────────────────────────────────────────────────────── */
export function Reveal({
  children,
  delay = 0,
  className,
  y = 48,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
  as?: "div" | "section";
}) {
  const Comp = as === "section" ? motion.section : motion.div;
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 1.05, ease: EASE_CINEMATIC, delay }}
    >
      {children}
    </Comp>
  );
}

/* ────────────────────────────────────────────────────────────
 * Masked line reveal for display headlines.
 * ──────────────────────────────────────────────────────────── */
export function MaskedLines({
  lines,
  className,
  lineClassName,
  delay = 0.15,
  stagger = 0.1,
}: {
  lines: React.ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  stagger?: number;
}) {
  return (
    <span className={cn("block", className)}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
          <motion.span
            className={cn("block", lineClassName)}
            initial={{ y: "115%", rotate: 2.5 }}
            animate={{ y: "0%", rotate: 0 }}
            transition={{ duration: 1.25, ease: EASE_CINEMATIC, delay: delay + i * stagger }}
            style={{ transformOrigin: "0% 100%" }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────
 * Count-up number. Text is written imperatively so parent
 * re-renders (live block polling) never interrupt the tween.
 * ──────────────────────────────────────────────────────────── */
export function AnimatedNumber({
  value,
  format,
  duration = 1.4,
  className,
}: {
  value: number;
  format: (v: number) => string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const current = useRef(0);
  const formatRef = useRef(format);
  formatRef.current = format;
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });

  useLayoutEffect(() => {
    if (ref.current && !ref.current.textContent) ref.current.textContent = formatRef.current(0);
  }, []);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(current.current, value, {
      duration,
      ease: EASE_OUT_EXPO,
      onUpdate: (v) => {
        current.current = v;
        if (ref.current) ref.current.textContent = formatRef.current(v);
      },
    });
    return () => controls.stop();
  }, [value, inView, duration]);

  return <span ref={ref} className={cn("tabular-nums", className)} />;
}

/* ────────────────────────────────────────────────────────────
 * Odometer — each digit rolls independently.
 * ──────────────────────────────────────────────────────────── */
export function RollingNumber({ value, className }: { value: number | string; className?: string }) {
  const chars = String(value).split("");
  return (
    <span className={cn("inline-flex tabular-nums", className)} aria-label={String(value)}>
      {chars.map((ch, i) => (
        <span key={chars.length - i} className="relative inline-flex h-[1.15em] overflow-hidden leading-[1.15em]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={ch}
              className="inline-block"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay: (chars.length - i) * 0.015 }}
            >
              {ch}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────
 * Streamed text — words resolve from blur, like an agent typing.
 * ──────────────────────────────────────────────────────────── */
export function StreamText({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <motion.span
      key={text}
      className={className}
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: Math.min(0.03, 0.9 / words.length), delayChildren: 0.1 } } }}
    >
      {words.map((w, i) => (
        <motion.span
          key={i}
          className="inline-block whitespace-pre"
          variants={{
            hidden: { opacity: 0, y: 4, filter: "blur(6px)" },
            show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: EASE_OUT_EXPO } },
          }}
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </motion.span>
  );
}

/* ────────────────────────────────────────────────────────────
 * Self-drawing check mark
 * ──────────────────────────────────────────────────────────── */
export function DrawnCheck({ className, delay = 0.1 }: { className?: string; delay?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <motion.circle
        cx="12"
        cy="12"
        r="10.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.35"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: EASE_CINEMATIC, delay }}
      />
      <motion.path
        d="M7.5 12.5l3 3 6-7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay: delay + 0.45 }}
      />
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────
 * Voice waveform — 5 bars, alive only while speaking.
 * ──────────────────────────────────────────────────────────── */
export function VoiceBars({ active, className }: { active: boolean; className?: string }) {
  const heights = [0.45, 0.9, 0.6, 1, 0.5];
  return (
    <span className={cn("flex h-3.5 items-center gap-[2px]", className)} aria-hidden>
      {heights.map((h, i) => (
        <motion.span
          key={i}
          className="block w-[2px] rounded-full bg-current"
          style={{ height: "100%", originY: 0.5 }}
          animate={active ? { scaleY: [h * 0.3, h, h * 0.45, h * 0.85, h * 0.3] } : { scaleY: 0.22 }}
          transition={
            active
              ? { duration: 0.9 + i * 0.08, repeat: Infinity, ease: EASE_CINEMATIC, delay: i * 0.06 }
              : { duration: 0.4, ease: EASE_OUT_EXPO }
          }
        />
      ))}
    </span>
  );
}

/* Small hairline label/value row */
export function DataRow({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-4 py-3", className)}>
      <span className="text-[12px] text-white/40">{label}</span>
      <span className="min-w-0 truncate text-right text-[13px] text-white/90">{children}</span>
    </div>
  );
}

/* Card header — mono index, title, and a meta slot */
export function CardHeader({
  index,
  title,
  meta,
  right,
}: {
  index: string;
  title: string;
  meta?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] text-white/30">{index}</span>
        <span className="h-3 w-px bg-white/10" />
        <h3 className="text-[13px] font-medium tracking-[-0.01em] text-white/85">{title}</h3>
      </div>
      {right ?? (meta && <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/30">{meta}</span>)}
    </div>
  );
}
