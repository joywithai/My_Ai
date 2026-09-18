"use client";
import { useEffect, useRef, useState } from "react";
import { getEngine } from "@/lib/engine/AvatarEngine";
import { useSettings } from "@/lib/store/settings";
import { useFraming } from "@/lib/store/framing";

type Mode = "landing" | "chat" | "preview";

/** landing framing — head never cropped, room above the hair */
export const LANDING_FRAMING = {
  targetY: 1.32,
  camY: 1.36,
  camZ: 2.15,
  fov: 33,
};

export default function AvatarStage({
  mode,
  onLoaded,
  className,
}: {
  mode: Mode;
  onLoaded?: () => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  const settings = useSettings((s) => s.settings);
  const framing = useFraming((s) => s.framing);

  // mount + load once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = getEngine();
    engine.mount(canvas);
    let greetTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false; // StrictMode double-mount guard

    // selected avatar model (female default focus; male optional) with fallback
    const wantsMale = mode !== "landing" && useSettings.getState().settings.avatarModelId === "avatar-male";
    const file = wantsMale ? "/models/avatar-male.vrm" : "/models/avatar.vrm";
    engine
      .load(file, setProgress)
      .catch(() => engine.load("/models/avatar.vrm", setProgress))
      .then(() => {
        if (cancelled) return;
        setReady(true);
        if (mode === "landing") {
          engine.setState("idle");
        } else if (mode === "chat") {
          engine.setState("greeting");
          greetTimer = setTimeout(() => {
            if (getEngine().state === "greeting") getEngine().setState("idle");
          }, 2700);
        } else {
          engine.setState("idle");
        }
        onLoaded?.();
      })
      .catch((e) => console.error("VRM load failed", e));

    return () => {
      cancelled = true;
      if (greetTimer) clearTimeout(greetTimer);
      engine.detach();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // live-sync settings → engine
  useEffect(() => {
    const e = getEngine();
    e.setEnabledAnimations(settings.enabledAnimations);
    e.setBlinkEnabled(settings.blinkEnabled);
    e.setThinkingPoseEnabled(settings.thinkingPoseEnabled);
  }, [settings.enabledAnimations, settings.blinkEnabled, settings.thinkingPoseEnabled]);

  // default expression → engine
  useEffect(() => {
    const e = getEngine();
    e.defaultExpression = settings.defaultExpression;
    if (e.loaded && e.state === "idle") e.setState("idle");
  }, [settings.defaultExpression]);

  // live-sync framing → engine (chat uses admin-locked value, preview live)
  useEffect(() => {
    if (mode === "landing") return;
    getEngine().setFraming(framing, ready);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [framing, mode]);

  // server-enforced admin framing (README: admin sets, everyone sees)
  useEffect(() => {
    if (mode !== "chat") return;
    let cancelled = false;
    fetch("/api/framing")
      .then((r) => r.json())
      .then(({ framing: f }) => {
        if (!cancelled && f?.locked) {
          const { targetY, camY, camZ, fov } = f;
          getEngine().setFraming({ targetY, camY, camZ, fov });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [mode, ready]);

  useEffect(() => {
    if (mode === "landing" && ready) {
      getEngine().setFraming(LANDING_FRAMING);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, ready]);

  return (
    <div className={`relative h-full w-full overflow-hidden ${className ?? ""}`}>
      <canvas ref={canvasRef} className="h-full w-full" />

      {!ready && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-7">
          {/* glowing orb + spinning gradient ring */}
          <div className="relative h-36 w-36">
            <div className="loading-glow absolute -inset-7 rounded-full bg-accent/10 blur-2xl" />
            <div className="loading-ring absolute inset-0 rounded-full" />
            <div className="absolute inset-[7px] flex items-center justify-center rounded-full bg-[#0c0b12]">
              <span className="bg-gradient-to-br from-accent to-indigo-300 bg-clip-text text-4xl font-black text-transparent">
                M
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <span className="text-sm font-semibold tracking-wide text-txt/90">
              My<span className="text-accent">Ai</span>{" "}
              {settings.language === "bn" ? "জাগছে…" : "is waking up…"}
            </span>
            <div className="h-1 w-44 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-indigo-400 transition-all duration-300"
                style={{ width: `${Math.max(progress, 4)}%` }}
              />
            </div>
            <span className="font-mono text-[11px] text-muted">{progress}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
