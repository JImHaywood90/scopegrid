"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

/* If you already have these hooks, keep yours and remove these stubs */
// import { usePrefersReducedMotion } from "./your-hooks";
// import { useInView } from "./your-hooks";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

function useInView<T extends Element>() {
  const ref = React.useRef<T | null>(null);
  const [inView, setInView] = React.useState(true);
  React.useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? true),
      { threshold: 0 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return { ref, inView };
}

type Logo = { src: string; alt: string };

/** Extend this with all available vendors */
const BASE_LOGOS: Logo[] = [
  { src: "/logos/microsoft250.png", alt: "Microsoft 365" },
  { src: "/logos/sentinel250.png", alt: "SentinelOne" },
  { src: "/logos/Veeam250_light.png", alt: "Veeam" },
  { src: "/logos/mimecast250.png", alt: "Mimecast" },
  { src: "/logos/meraki250.png", alt: "Meraki" },
  { src: "/logos/datto250.png", alt: "Datto" },
  { src: "/logos/acronis250_light.png", alt: "Acronis" },
  { src: "/logos/webroot250_light.png", alt: "Webroot" },
  { src: "/logos/AutoElevate250_light.png", alt: "AutoElevate" },
  { src: "/logos/automate250_light.png", alt: "ConnectWise RMM" },
  { src: "/logos/unifi250_light.png", alt: "Unifi" },
  { src: "/logos/sonicwall250.png", alt: "Sonicwall" },
  { src: "/logos/storagecraft50.png", alt: "StorageCraft" },
  { src: "/logos/usecure_light.png", alt: "uSecure" },
  { src: "/logos/barracuda250_light.png", alt: "Barracuda" },
  { src: "/logos/auvik250_light.png", alt: "Auvik" },
  { src: "/logos/fortinet250_light.png", alt: "Fortinet" },
  { src: "/logos/knowbe4_light.png", alt: "KnowBe4" },
];

/** Split logos roughly in half for two lanes (keeps height compact). */
function splitInTwo<T>(arr: T[]) {
  const mid = Math.ceil(arr.length / 2);
  return [arr.slice(0, mid), arr.slice(mid)];
}

/** A single scrolling lane, direction controlled by CSS class */
function MarqueeLane({
  logos,
  direction = "left",
  speedSeconds = 90,
  paused,
  reduced,
}: {
  logos: { src: string; alt: string }[];
  direction?: "left" | "right";
  speedSeconds?: number;
  paused: boolean;
  reduced: boolean;
}) {
  // duplicate for seamless loop
  const track = React.useMemo(() => [...logos, ...logos], [logos]);

  return (
    <div className="overflow-hidden">
      <div
        className={[
          "flex items-center gap-12 py-4 whitespace-nowrap will-change-transform",
          reduced ? "" : direction === "left" ? "marquee-l" : "marquee-r",
          paused ? "paused" : "",
        ].join(" ")}
        style={
          reduced
            ? undefined
            : ({
                "--speed": `${speedSeconds}s`,
              } as React.CSSProperties)
        }
        aria-hidden="true"
      >
        {track.map((l, i) => (
          <Image
            key={`${l.alt}-${i}`}
            src={l.src}
            alt={l.alt}
            width={220}
            height={88}
            className="h-10 sm:h-12 md:h-14 w-auto object-contain opacity-85 hover:opacity-100 transition"
          />
        ))}
      </div>
    </div>
  );
}

export default function LogoMarquee() {
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  // Two lanes (A: left→right, B: right→left)
  const [laneA, laneB] = React.useMemo(() => splitInTwo(BASE_LOGOS), []);

  // Search for the full-catalog dialog
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return BASE_LOGOS;
    return BASE_LOGOS.filter(
      (l) => l.alt.toLowerCase().includes(q) || l.src.toLowerCase().includes(q)
    );
  }, [query]);

  // A little longer if we have many logos
  const speedA = Math.max(70, laneA.length * 6);
  const speedB = Math.max(70, laneB.length * 6);

  return (
    <div className="bg-slate-900 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-slate-300 text-sm uppercase tracking-wider">
          Auto-detects the following products from your PSA
        </p>

        <div
          ref={ref}
          className="mt-8 rounded-xl ring-1 ring-white/5 bg-slate-900/40"
        >
          {/* Two compact lanes */}
          <MarqueeLane
            logos={laneA}
            direction="left"
            speedSeconds={speedA}
            paused={!inView}
            reduced={reduced}
          />
          <div className="h-px bg-white/5" />
          <MarqueeLane
            logos={laneB}
            direction="right"
            speedSeconds={speedB}
            paused={!inView}
            reduced={reduced}
          />
        </div>

        {/* CTA to open full catalog */}
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => setDialogOpen(true)}
          >
            View full catalog
          </Button>
        </div>

        {/* Full catalog dialog with search */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Supported products</DialogTitle>
            </DialogHeader>
            <div className="mt-2">
              <Input
                placeholder="Search vendors or products…"
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                className="mb-4"
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-auto">
                {filtered.map((l) => (
                  <div
                    key={l.alt}
                    className="flex items-center justify-center rounded-xl border border-slate-200/70 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur p-3"
                  >
                    <Image
                      src={l.src}
                      alt={l.alt}
                      width={220}
                      height={88}
                      className="max-h-10 w-auto object-contain"
                    />
                  </div>
                ))}
              </div>
              {filtered.length === 0 && (
                <p className="mt-4 text-sm text-slate-500">No results.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* animations */}
      <style jsx global>{`
        .marquee-l {
          animation: marquee-left var(--speed, 90s) linear infinite;
        }
        .marquee-r {
          animation: marquee-right var(--speed, 90s) linear infinite;
        }
        .paused {
          animation-play-state: paused !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-l,
          .marquee-r {
            animation: none !important;
            transform: none !important;
          }
        }
        @keyframes marquee-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes marquee-right {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
