"use client";
import { useEffect, useRef, useState } from "react";
import { getEngine } from "@/lib/engine/AvatarEngine";
import { useSettings } from "@/lib/store/settings";
import { useFraming } from "@/lib/store/framing";
import { Loader2 } from "lucide-react";

type Mode = "landing" | "chat" | "preview";

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

    engine
      .load("/models/avatar.vrm", setProgress)
      .then(() => {
        setReady(true);
        if (mode === "landing") {
          engine.setState("shh");
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

  useEffect(() => {
    if (mode === "landing" && ready) {
      getEngine().setFraming({ targetY: 1.3, camY: 1.33, camZ: 1.95, fov: 33 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, ready]);

  return (
    <div className={`relative h-full w-full overflow-hidden ${className ?? ""}`}>
      <canvas ref={canvasRef} className="h-full w-full" />

      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="skeleton h-40 w-40 rounded-full" />
          <div className="flex items-center gap-2 text-xs text-muted">
            <Loader2 size={13} className="animate-spin text-accent" />
            {progress < 100 ? `Avatar লোড হচ্ছে… ${progress}%` : "প্রস্তুত হচ্ছে…"}
          </div>
        </div>
      )}
    </div>
  );
}
