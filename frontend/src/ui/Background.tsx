import { motion } from "framer-motion";

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * Fixed atmospheric layer: drifting mesh orbs, masked hairline grid,
 * a compliance-alert wash, and film grain. Everything here is fixed +
 * pointer-events-none so it never repaints with scroll.
 */
export function AmbientBackground({ alert }: { alert: boolean }) {
  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#050505]">
        <div
          className="absolute -left-[15vmax] -top-[35vmax] h-[80vmax] w-[80vmax] animate-orb-a rounded-full will-change-transform"
          style={{ background: "radial-gradient(circle at center, rgba(16,185,129,0.16), rgba(16,185,129,0) 62%)" }}
        />
        <div
          className="absolute -right-[25vmax] top-[10vh] h-[70vmax] w-[70vmax] animate-orb-b rounded-full will-change-transform"
          style={{ background: "radial-gradient(circle at center, rgba(99,102,241,0.12), rgba(99,102,241,0) 60%)" }}
        />
        <div
          className="absolute -bottom-[40vmax] left-[20vw] h-[70vmax] w-[70vmax] animate-orb-c rounded-full"
          style={{ background: "radial-gradient(circle at center, rgba(45,212,191,0.07), rgba(45,212,191,0) 60%)" }}
        />
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{ opacity: alert ? 1 : 0 }}
          transition={{ duration: alert ? 0.25 : 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(244,63,94,0.16), rgba(244,63,94,0) 70%)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "88px 88px",
            maskImage: "radial-gradient(ellipse 70% 55% at 50% 0%, black 10%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 55% at 50% 0%, black 10%, transparent 75%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-gradient-to-t from-[#050505] to-transparent" />
      </div>
      {/* Film grain — top systemic layer, never intercepts input */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[70] opacity-[0.045] mix-blend-overlay"
        style={{ backgroundImage: GRAIN }}
      />
    </>
  );
}
