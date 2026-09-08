import { MODEL_OPTIONS } from '../../domain/model/model-picker';
import {
  DEFAULT_SERVER_ID,
  LEGACY_CUSTOM_SERVER_ID,
  normalizeServerBaseUrl,
  normalizeServerModels,
  normalizeServerProfile,
  type ServerProfile,
  type ServerProfileInput,
} from '../../domain/server/server-profile';

const STORAGE_KEY = 'medical-harness-agent.setup.v1';
const LEGACY_DEFAULT_MODEL = 'x-ai/grok-4.6';

export interface SetupSettings {
  gatewayBaseUrl: string;
  customGatewayBaseUrl: string;
  apiKey: string;
  customModels: string[];
  selectedModel: string;
  activeServerId: string;
  customServers: ServerProfile[];
}

export interface SetupSettingsInput {
  gatewayBaseUrl?: string | null;
  customGatewayBaseUrl?: string | null;
  apiKey?: string | null;
  customModels?: string | string[] | null;
  selectedModel?: string | null;
  activeServerId?: string | null;
  customServers?: ServerProfileInput[] | null;
}

export const DEFAULT_SETUP_SETTINGS: SetupSettings = {
  gatewayBaseUrl: '',
  customGatewayBaseUrl: '',
  apiKey: '',
  customModels: [],
  selectedModel: 'deepseek/deepseek-v4-flash',
  activeServerId: DEFAULT_SERVER_ID,
  customServers: [],
};

export function normalizeGatewayBaseUrl(value: string | null | undefined): string {
  return normalizeServerBaseUrl(value);
}

export function normalizeModelRoutes(value: string | string[] | null | undefined): string[] {
  return normalizeServerModels(value);
}

export function loadSetupSettings(): SetupSettings {
  const stored = readStorage();
  if (!stored) {
    return cloneDefaults();
  }

  try {
    const parsed = JSON.parse(stored) as SetupSettingsInput & { selectedModelExplicit?: boolean };
    const normalized = normalizeSetup(parsed);
    return parsed.selectedModelExplicit === true || parsed.selectedModel?.trim() !== LEGACY_DEFAULT_MODEL
      ? normalized
      : { ...normalized, selectedModel: DEFAULT_SETUP_SETTINGS.selectedModel };
  } catch {
    return cloneDefaults();
  }
}

export function saveSetupSettings(settings: SetupSettingsInput): SetupSettings {
  const normalized = normalizeSetup(settings);

  try {
    globalThis.localStorage?.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...normalized, selectedModelExplicit: true }),
    );
  } catch {
    // Browser storage can be unavailable in private mode or when disabled.
  }

  return normalized;
}

function normalizeSetup(settings: SetupSettingsInput): SetupSettings {
  const legacyModels = normalizeModelRoutes(settings.customModels);
  const legacyGateway = normalizeGatewayBaseUrl(settings.customGatewayBaseUrl);
  const legacyApiKey = settings.apiKey?.trim() ?? '';
  const hasServerProfiles = Array.isArray(settings.customServers);
  const customServers = normalizeCustomServers(settings.customServers);
  if (!hasServerProfiles && (legacyGateway || legacyModels.length > 0 || legacyApiKey)) {
    customServers.push(normalizeServerProfile({
      id: LEGACY_CUSTOM_SERVER_ID,
      name: 'Server tùy chỉnh 1',
      baseUrl: legacyGateway || normalizeGatewayBaseUrl(settings.gatewayBaseUrl),
      apiKey: legacyApiKey,
      models: legacyModels,
      selectedModel: settings.selectedModel,
    }, LEGACY_CUSTOM_SERVER_ID));
  }

  const requestedServerId = settings.activeServerId?.trim() ?? '';
  const gatewayBaseUrl = normalizeGatewayBaseUrl(settings.gatewayBaseUrl);
  const activeServerId = customServers.some((server) => server.id === requestedServerId)
    ? requestedServerId
    : gatewayBaseUrl && customServers[0]
      ? customServers[0].id
      : DEFAULT_SERVER_ID;
  const activeServer = customServers.find((server) => server.id === activeServerId);
  const customServer = customServers[0];
  const customGatewayBaseUrl = customServer?.baseUrl ?? legacyGateway;
  const customModels = activeServer?.models ?? customServer?.models ?? legacyModels;
  const selectedModel = activeServer?.selectedModel
    || (activeServerId === DEFAULT_SERVER_ID ? settings.selectedModel?.trim() : '')
    || (activeServerId === DEFAULT_SERVER_ID ? MODEL_OPTIONS[0]?.route ?? '' : customModels[0] ?? '');
  const apiKey = activeServer?.apiKey ?? customServer?.apiKey ?? legacyApiKey;
  const availableRoutes = new Set(MODEL_OPTIONS.map((option) => option.route));
  customServers.forEach((server) => server.models.forEach((route) => availableRoutes.add(route)));

  return {
    gatewayBaseUrl: activeServerId === DEFAULT_SERVER_ID ? '' : activeServer?.baseUrl ?? gatewayBaseUrl,
    customGatewayBaseUrl,
    apiKey,
    customModels,
    selectedModel: availableRoutes.has(selectedModel)
      ? selectedModel
      : activeServer?.selectedModel ?? DEFAULT_SETUP_SETTINGS.selectedModel,
    activeServerId,
    customServers,
  };
}

function normalizeCustomServers(value: ServerProfileInput[] | null | undefined): ServerProfile[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const servers: ServerProfile[] = [];
  for (const item of value) {
    const fallbackId = `custom-${servers.length + 1}`;
    const profile = normalizeServerProfile({ ...item, readOnly: false }, fallbackId);
    if (!servers.some((server) => server.id === profile.id)) {
      servers.push(profile);
    }
  }

  return servers;
}

function readStorage(): string | null {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

function cloneDefaults(): SetupSettings {
  return {
    gatewayBaseUrl: DEFAULT_SETUP_SETTINGS.gatewayBaseUrl,
    customGatewayBaseUrl: DEFAULT_SETUP_SETTINGS.customGatewayBaseUrl,
    apiKey: DEFAULT_SETUP_SETTINGS.apiKey,
    customModels: [...DEFAULT_SETUP_SETTINGS.customModels],
    selectedModel: DEFAULT_SETUP_SETTINGS.selectedModel,
    activeServerId: DEFAULT_SETUP_SETTINGS.activeServerId,
    customServers: DEFAULT_SETUP_SETTINGS.customServers.map((server) => ({ ...server, models: [...server.models] })),
  };
}
