"use client";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils, type VRM } from "@pixiv/three-vrm";
import { AvatarFraming } from "../types";
import { ExpressionController } from "./expressions";
import { buildSpeakTimeline, SpeakTimeline, Viseme } from "./lipsync";
import { POSES, BASE_EXPRESSION } from "./poses";

export type AvatarState =
  | "loading"
  | "shh"
  | "greeting"
  | "idle"
  | "thinking"
  | "speaking";

const VISemes: Viseme[] = ["aa", "ih", "ou", "ee", "oh"];

export class AvatarEngine {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private raf = 0;
  private canvas: HTMLCanvasElement | null = null;
  private ro: ResizeObserver | null = null;

  public vrm: VRM | null = null;
  public loaded = false;
  state: AvatarState = "loading";

  private lookTarget = new THREE.Object3D();
  private lookMode: "camera" | "think" | "speak" = "camera";

  defaultExpression = "relaxed";

  /** debug: disable greeting wave overlay while tuning */
  debugFreezeWave = false;

  /** debug: mutate a pose at runtime (tuning) */
  debugSetPose(name: string, map: Record<string, [number, number, number]>) {
    const pose = POSES[name];
    if (!pose) return;
    for (const [bone, e] of Object.entries(map)) {
      pose[bone] = e;
    }
  }

  private expressions = new ExpressionController();
  private poseTargets: Record<string, THREE.Euler> = {};
  private enabledAnimations: string[] = ["breathing"];
  private blinkEnabled = true;
  private thinkingPoseEnabled = true;

  private blinkTimer = 2;
  private blinkPhase = -1; // -1 idle, else seconds into blink

  private timeline: SpeakTimeline | null = null;
  private tlStart = 0;
  private tlIdx = 0;
  private segIdx = -1;
  onSegment: ((idx: number) => void) | null = null;
  onDone: (() => void) | null = null;

  private mouth: Record<string, number> = {};
  private framing: AvatarFraming = { targetY: 1.32, camY: 1.38, camZ: 1.55, fov: 33 };
  private camGoal = new THREE.Vector3(0, 1.38, 1.55);
  private lookGoalY = 1.32;
  private fovGoal = 33;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(33, 1, 0.1, 20);
    this.camera.position.set(0, 1.38, 1.55);
    this.scene.add(this.camera);
    this.setupLights();
    this.scene.add(this.lookTarget);
    this.vrm = null;
    for (const v of VISemes) this.mouth[v] = 0;
  }

  private setupLights() {
    const amb = new THREE.AmbientLight(0xffffff, 0.9);
    const key = new THREE.DirectionalLight(0xfff1e0, 1.15);
    key.position.set(1.4, 2.2, 2.2);
    const fill = new THREE.DirectionalLight(0xbfd0ff, 0.4);
    fill.position.set(-2, 1.4, 1.2);
    const rim = new THREE.DirectionalLight(0xa78bfa, 0.7);
    rim.position.set(0, 2.6, -1.8);
    this.scene.add(amb, key, fill, rim);
  }

  /** attach to a canvas (re-creates renderer if canvas changed) */
  mount(canvas: HTMLCanvasElement) {
    if (this.canvas !== canvas) {
      this.renderer?.dispose();
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      this.renderer.setClearAlpha(0);
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.canvas = canvas;
      if (this.vrm) this.scene.add(this.vrm.scene);
    }
    this.resize();
    this.ro?.disconnect();
    this.ro = new ResizeObserver(() => this.resize());
    if (canvas.parentElement) this.ro.observe(canvas.parentElement);
    this.clock.start();
    if (!this.raf) this.raf = requestAnimationFrame(this.tick);
  }

  detach() {
    this.ro?.disconnect();
    this.ro = null;
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  private resize() {
    if (!this.renderer || !this.canvas) return;
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (!w || !h) return;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  async load(url: string, onProgress?: (p: number) => void) {
    if (this.loaded) return;
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    const gltf = await new Promise<any>((resolve, reject) => {
      loader.load(
        url,
        (g) => resolve(g),
        (xhr) => {
          if (xhr.total && onProgress)
            onProgress(Math.round((xhr.loaded / xhr.total) * 100));
        },
        (e) => reject(e)
      );
    });
    const vrm: VRM = gltf.userData.vrm;
    VRMUtils.removeUnnecessaryJoints(gltf.scene);
    vrm.scene.traverse((o) => {
      o.frustumCulled = false;
    });
    if (vrm.lookAt) vrm.lookAt.target = this.lookTarget;
    this.vrm = vrm;
    this.scene.add(vrm.scene);
    this.loaded = true;
    this.setState("idle");
    if (typeof window !== "undefined") {
      (window as any).__myaiAvatar = true;
      (window as any).__engine = this; // debugging/tuning
    }
  }

  /** debug helper: world positions of key bones */
  debugPositions() {
    if (!this.vrm) return null;
    const out: Record<string, { x: number; y: number; z: number }> = {};
    const v = new THREE.Vector3();
    for (const b of [
      "head",
      "neck",
      "rightUpperArm",
      "rightLowerArm",
      "rightHand",
      "rightIndexDistal",
      "leftUpperArm",
      "leftHand",
      "hips",
    ]) {
      const n = this.vrm.humanoid?.getNormalizedBoneNode(b as any);
      if (n) {
        n.getWorldPosition(v);
        out[b] = { x: +v.x.toFixed(3), y: +v.y.toFixed(3), z: +v.z.toFixed(3) };
      }
    }
    out["__camera"] = {
      x: +this.camera.position.x.toFixed(3),
      y: +this.camera.position.y.toFixed(3),
      z: +this.camera.position.z.toFixed(3),
    };
    return out;
  }

  setState(s: AvatarState) {
    this.state = s;
    this.expressions.setComposite(BASE_EXPRESSION[s] ?? "neutral");
    this.lookMode =
      s === "thinking" ? "think" : s === "speaking" ? "speak" : "camera";
    if (s !== "speaking") {
      this.timeline = null;
      this.segIdx = -1;
      for (const v of VISemes) this.mouth[v] = 0;
    }
  }

  setEnabledAnimations(list: string[]) {
    this.enabledAnimations = list;
  }
  setBlinkEnabled(b: boolean) {
    this.blinkEnabled = b;
  }
  setThinkingPoseEnabled(b: boolean) {
    this.thinkingPoseEnabled = b;
  }

  setFraming(f: AvatarFraming, immediate = false) {
    this.framing = f;
    this.camGoal.set(0, f.camY, f.camZ);
    this.lookGoalY = f.targetY;
    this.fovGoal = f.fov;
    if (immediate) {
      this.camera.position.copy(this.camGoal);
      this.camera.fov = f.fov;
      this.camera.updateProjectionMatrix();
    }
  }

  /** start speaking from a timeline built by buildSpeakTimeline */
  speakWithTimeline(tl: SpeakTimeline) {
    this.timeline = tl;
    this.tlStart = performance.now();
    this.tlIdx = 0;
    this.segIdx = -1;
    this.setState("speaking");
  }

  stopSpeaking() {
    this.setState("idle");
  }

  private updateBlink(dt: number) {
    if (!this.blinkEnabled) return 0;
    if (this.blinkPhase < 0) {
      this.blinkTimer -= dt;
      if (this.blinkTimer <= 0) {
        this.blinkPhase = 0;
        this.blinkTimer = 2 + Math.random() * 4;
      }
      return 0;
    }
    this.blinkPhase += dt;
    const p = this.blinkPhase;
    const D1 = 0.07,
      D2 = 0.1,
      D3 = 0.17;
    let w = 0;
    if (p < D1) w = p / D1;
    else if (p < D2) w = 1;
    else if (p < D3) w = 1 - (p - D2) / (D3 - D2);
    else {
      this.blinkPhase = -1;
      w = 0;
    }
    return w;
  }

  private updateMouth(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const v of VISemes) out[v] = 0;
    if (this.state !== "speaking" || !this.timeline) return out;
    const t = performance.now() - this.tlStart;
    const items = this.timeline.items;
    while (this.tlIdx < items.length && items[this.tlIdx].t1 < t) this.tlIdx++;
    const cur = items[this.tlIdx];
    if (cur && t >= cur.t0 && t <= cur.t1) out[cur.viseme] = cur.amp;
    // segment change → expression + callback
    let si = -1;
    for (let i = 0; i < this.timeline.segs.length; i++) {
      if (t >= this.timeline.segs[i].t0 && t <= this.timeline.segs[i].t1) {
        si = i;
        break;
      }
    }
    if (si !== this.segIdx) {
      this.segIdx = si;
      if (si >= 0) {
        this.expressions.setComposite(this.timeline.segs[si].expr);
        this.onSegment?.(si);
      }
    }
    if (t > this.timeline.totalMs) {
      const done = this.onDone;
      this.setState("idle");
      done?.();
    }
    return out;
  }

  private updatePose(t: number, dt: number) {
    const vrm = this.vrm;
    if (!vrm) return;
    const poseName =
      this.state === "thinking" && !this.thinkingPoseEnabled ? "idle" : this.state;
    const pose = POSES[poseName] ?? POSES.idle;

    // collect target rotations (pose + procedural overlays)
    const targets: Record<string, [number, number, number]> = {};
    for (const [bone, e] of Object.entries(pose)) targets[bone] = [e[0], e[1], e[2]];

    // breathing — always on (subtle)
    const br = Math.sin(t * 1.5);
    targets.chest = [(targets.chest?.[0] ?? 0) + 0.014 * br, 0, 0];
    targets.spine = [(targets.spine?.[0] ?? 0) + 0.008 * br, 0, 0];

    // idle sway / speaking motion
    if (this.state === "idle" || this.state === "speaking" || this.state === "shh") {
      if (this.enabledAnimations.includes("head-sway")) {
        targets.head = add(targets.head, [0, 0.045 * Math.sin(t * 0.4), 0.02 * Math.sin(t * 0.23 + 1)]);
        targets.neck = add(targets.neck, [0, 0.02 * Math.sin(t * 0.33 + 2), 0]);
      }
      if (this.enabledAnimations.includes("shoulder-bob")) {
        targets.leftShoulder = add(targets.leftShoulder, [0, 0, -0.03 * br]);
        targets.rightShoulder = add(targets.rightShoulder, [0, 0, 0.03 * br]);
      }
    }

    // greeting wave overlay
    if (this.state === "greeting") {
      const w = Math.sin(t * Math.PI * 2 * 2.6);
      targets.rightLowerArm = add(targets.rightLowerArm, [0, 0, 0.45 * w]);
      targets.rightHand = add(targets.rightHand, [0, 0, -0.25 * w]);
    }

    // thinking micro motion (finger tap)
    if (this.state === "thinking") {
      targets.rightIndexProximal = add(targets.rightIndexProximal, [
        0.06 * Math.sin(t * 9),
        0,
        0,
      ]);
    }

    // damp toward targets
    const k = 1 - Math.exp(-10 * dt);
    for (const [bone, e] of Object.entries(targets)) {
      const node = vrm.humanoid?.getNormalizedBoneNode(bone as any);
      if (!node) continue;
      if (!this.poseTargets[bone]) this.poseTargets[bone] = new THREE.Euler();
      const cur = this.poseTargets[bone];
      cur.x += (e[0] - cur.x) * k;
      cur.y += (e[1] - cur.y) * k;
      cur.z += (e[2] - cur.z) * k;
      node.rotation.copy(cur);
    }
  }

  private updateLook(t: number) {
    if (this.lookMode === "think") {
      this.lookTarget.position.set(
        0.9 + 0.08 * Math.sin(t * 0.5),
        2.1 + 0.05 * Math.sin(t * 0.8),
        1.1
      );
    } else if (this.lookMode === "speak") {
      this.lookTarget.position.set(
        0.12 * Math.sin(t * 0.6),
        this.camera.position.y + 0.05 * Math.sin(t * 0.9),
        this.camera.position.z
      );
    } else {
      this.lookTarget.position.set(
        0.06 * Math.sin(t * 0.35),
        this.camera.position.y,
        this.camera.position.z
      );
    }
    // smooth camera
    const k = 1 - Math.exp(-4 * this.clock.getDelta() + 0.0001);
    void k;
  }

  private tick = () => {
    this.raf = requestAnimationFrame(this.tick);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;
    const vrm = this.vrm;
    const renderer = this.renderer;
    if (!renderer) return;

    // camera damped toward framing goal
    const kc = 1 - Math.exp(-5 * dt);
    this.camera.position.lerp(this.camGoal, kc);
    const curFov = this.camera.fov + (this.fovGoal - this.camera.fov) * kc;
    if (Math.abs(curFov - this.camera.fov) > 0.01) {
      this.camera.fov = curFov;
      this.camera.updateProjectionMatrix();
    }

    if (vrm && this.loaded) {
      this.updatePose(t, dt);
      this.updateLook(t);

      // expressions
      const em = vrm.expressionManager;
      if (em) {
        const blink = this.updateBlink(dt);
        const mouth = this.updateMouth();
        this.expressions.update(dt, (p, w) => em.setValue(p, w));
        em.setValue("blink", blink);
        // mouth visemes — fast damping for crisp lips
        const km = 1 - Math.exp(-30 * dt);
        for (const v of VISemes) {
          this.mouth[v] += ((mouth[v] ?? 0) - this.mouth[v]) * km;
          em.setValue(v, this.mouth[v]);
        }
      }
      vrm.update(dt);
    }

    // camera look-at
    this.camera.lookAt(0, this.lookGoalY, 0);
    renderer.render(this.scene, this.camera);
  };
}

function add(
  base: [number, number, number] | undefined,
  d: [number, number, number]
): [number, number, number] {
  if (!base) return d;
  return [base[0] + d[0], base[1] + d[1], base[2] + d[2]];
}

let _engine: AvatarEngine | null = null;

export function getEngine(): AvatarEngine {
  if (!_engine) _engine = new AvatarEngine();
  return _engine;
}
