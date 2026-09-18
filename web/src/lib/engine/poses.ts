/**
 * Pose targets as Euler [x,y,z] radians on three-vrm NORMALIZED bone nodes.
 * Coordinate reference (VRM 1.0, model faces +Z):
 *   - character left arm extends toward +X, right arm toward -X
 *   - rotation.z: left negative / right positive brings arms DOWN
 * Euler order XYZ (three.js default): R = Rx * Ry * Rz
 */

export type Euler3 = [number, number, number];
export type PoseMap = Record<string, Euler3>;

/** arms straight, hanging close against the body */
const ARMS_DOWN: PoseMap = {
  leftUpperArm: [0, 0, -1.42],
  rightUpperArm: [0, 0, 1.42],
  leftLowerArm: [-0.08, 0, 0],
  rightLowerArm: [-0.08, 0, 0],
};

/** natural stance — landing, idle and thinking all share it */
const IDLE: PoseMap = { ...ARMS_DOWN };

/** After login — wave 👋 (optimizer-converged) */
const GREETING: PoseMap = {
  ...ARMS_DOWN, // arms stay natural — greeting reads via head sway
};

/** Speaking — natural stance, tiny head life */
const SPEAKING: PoseMap = {
  ...ARMS_DOWN,
  head: [0, 0, 0.02],
};

export const POSES: Record<string, PoseMap> = {
  greeting: GREETING,
  thinking: IDLE, // no hand raise — thinking reads via eyes-up + ??? bubbles
  idle: IDLE,
  speaking: SPEAKING,
};

export const BASE_EXPRESSION: Record<string, string> = {
  greeting: "happy",
  thinking: "thoughtful",
  idle: "relaxed",
  speaking: "friendly",
};
