export type Role = "admin" | "subscriber" | "public_user";

export type AvatarStateName =
  | "loading"
  | "greeting"
  | "idle"
  | "thinking"
  | "speaking";

/** Model-supported VRM expression presets */
export type PresetExpression =
  | "neutral"
  | "happy"
  | "angry"
  | "sad"
  | "relaxed"
  | "surprised";

export interface ExpressionSegment {
  expression: PresetExpression;
  text: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  language: "bn" | "en";
  segments?: ExpressionSegment[];
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

export interface FeatureFlags {
  canUseCustomApiKey: boolean;
  canAccessAllExpressions: boolean;
  canAccessAllAnimations: boolean;
  canSelectAvatarModel: boolean;
  canCustomizeVoice: boolean;
  canAccessChatHistory: boolean;
  maxConversationHistory: number; // -1 unlimited
  maxMessagesPerDay: number; // -1 unlimited
}

export interface UserSettings {
  language: "bn" | "en";
  uiLanguage: "bn" | "en";
  avatarModelId: string;
  voiceName: string;
  voiceSpeed: number; // 0.50 - 2.00
  voicePitch: number; // -50 - +50
  defaultExpression: string;
  enabledAnimations: string[];
  blinkEnabled: boolean;
  thinkingPoseEnabled: boolean;
  showSubtitles: boolean;
  autoPlayAudio: boolean;
  demoVoiceOn: boolean;
  customAi: CustomAiConfig | null;
}

export type AiProvider = "gemini" | "openrouter";

export interface CustomAiConfig {
  provider: AiProvider;
  maskedKey: string;
  model: string;
  baseUrl: string;
  temperature: number;
  maxOutputTokens: number;
}

export interface AvatarFraming {
  targetY: number; // look-at height
  camY: number; // camera height
  camZ: number; // camera distance
  fov: number;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  cycle: "monthly" | "yearly";
  features: string[];
  popular?: boolean;
}

export const DEFAULT_FLAGS: Record<Role, FeatureFlags> = {
  admin: {
    canUseCustomApiKey: true,
    canAccessAllExpressions: true,
    canAccessAllAnimations: true,
    canSelectAvatarModel: true,
    canCustomizeVoice: true,
    canAccessChatHistory: true,
    maxConversationHistory: -1,
    maxMessagesPerDay: -1,
  },
  subscriber: {
    canUseCustomApiKey: true,
    canAccessAllExpressions: true,
    canAccessAllAnimations: true,
    canSelectAvatarModel: true,
    canCustomizeVoice: true,
    canAccessChatHistory: true,
    maxConversationHistory: -1,
    maxMessagesPerDay: 500,
  },
  public_user: {
    canUseCustomApiKey: false,
    canAccessAllExpressions: false,
    canAccessAllAnimations: false,
    canSelectAvatarModel: false,
    canCustomizeVoice: false,
    canAccessChatHistory: true,
    maxConversationHistory: 10,
    maxMessagesPerDay: 50,
  },
};

export const DEFAULT_SETTINGS: UserSettings = {
  language: "bn",
  uiLanguage: "en",
  avatarModelId: "avatar-female",
  voiceName: "bn-BD-NabanitaNeural",
  voiceSpeed: 1.0,
  voicePitch: 0,
  defaultExpression: "relaxed",
  enabledAnimations: ["breathing"],
  blinkEnabled: true,
  thinkingPoseEnabled: true,
  showSubtitles: true,
  autoPlayAudio: true,
  demoVoiceOn: false,   // default: .NET Edge-TTS neural voice (browser voice = opt-in demo toggle)
  customAi: null,
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  subscriber: "Subscriber",
  public_user: "Public",
};
