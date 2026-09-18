/**
 * Pose targets as Euler [x,y,z] radians on three-vrm NORMALIZED bone nodes.
 * Coordinate reference (VRM 1.0, model faces +Z):
 *   - character left arm extends toward +X, right arm toward -X
 *   - rotation.z: left negative / right positive brings arms DOWN
 * Euler order XYZ (three.js default): R = Rx * Ry * Rz
 */

export type Euler3 = [number, number, number];
export type PoseMap = Record<string, Euler3>;

const ARMS_DOWN: PoseMap = {
  leftUpperArm: [0, 0, -1.12],
  rightUpperArm: [0, 0, 1.12],
  leftLowerArm: [-0.12, 0, 0],
  rightLowerArm: [-0.12, 0, 0],
};

/** Landing page — finger on lips, quiet waiting 🤫 (optimizer-converged) */
const SHH: PoseMap = {
  ...ARMS_DOWN,
  rightUpperArm: [0, 2.2, 1.46],
  rightLowerArm: [0.15, 0, -2.56],
  rightHand: [0.1, 0, 0.1],
  head: [0.06, 0, -0.05],
  neck: [0.04, 0, -0.03],
  // curl fingers except index (kept straight, touching lips)
  rightThumbProximal: [0.5, 0, 0.3],
  rightIndexProximal: [0, 0, 0],
  rightIndexIntermediate: [0, 0, 0],
  rightMiddleProximal: [0.9, 0, 0.4],
  rightMiddleIntermediate: [0.5, 0, 0.2],
  rightRingProximal: [0.9, 0, 0.4],
  rightRingIntermediate: [0.5, 0, 0.2],
  rightLittleProximal: [0.9, 0, 0.4],
  rightLittleIntermediate: [0.5, 0, 0.2],
};

/** After login — wave 👋 (optimizer-converged) */
const GREETING: PoseMap = {
  ...ARMS_DOWN,
  rightUpperArm: [0, 0.7, 0.75],
  rightLowerArm: [0.05, 0.55, -2.45],
  rightHand: [0, 0, 0.35],
  head: [-0.03, 0, -0.07],
};

/** Waiting for AI reply — hand under chin, eyes up 🤔 (optimizer-converged) */
const THINKING: PoseMap = {
  ...ARMS_DOWN,
  rightUpperArm: [0, 0.75, 1.15],
  rightLowerArm: [0.21, -0.45, -2.85],
  rightHand: [0.3, 0, -0.5],
  head: [0.05, 0, 0.12],
  neck: [0.03, 0, 0.07],
  rightThumbProximal: [0.5, 0, 0.3],
  rightIndexProximal: [0.4, 0, 0.2],
  rightIndexIntermediate: [0.5, 0, 0.2],
  rightMiddleProximal: [0.8, 0, 0.35],
  rightMiddleIntermediate: [0.6, 0, 0.25],
  rightRingProximal: [0.8, 0, 0.35],
  rightRingIntermediate: [0.6, 0, 0.25],
  rightLittleProximal: [0.8, 0, 0.35],
  rightLittleIntermediate: [0.6, 0, 0.25],
};

/** Normal conversation */
const IDLE: PoseMap = { ...ARMS_DOWN };

const SPEAKING: PoseMap = {
  ...ARMS_DOWN,
  head: [0, 0, 0.02],
};

export const POSES: Record<string, PoseMap> = {
  shh: SHH,
  greeting: GREETING,
  thinking: THINKING,
  idle: IDLE,
  speaking: SPEAKING,
};

export const BASE_EXPRESSION: Record<string, string> = {
  shh: "neutral",
  greeting: "happy",
  thinking: "thoughtful",
  idle: "relaxed",
  speaking: "friendly",
};
