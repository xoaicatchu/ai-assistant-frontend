import { MODEL_OPTIONS, isRemovedModelRoute } from '../model/model-picker';

export const DEFAULT_SERVER_ID = 'default';
export const LEGACY_CUSTOM_SERVER_ID = 'custom-1';

export interface ServerProfile {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  models: string[];
  selectedModel: string;
  readOnly: boolean;
}

export interface ServerProfileInput {
  id?: string | null;
  name?: string | null;
  baseUrl?: string | null;
  apiKey?: string | null;
  models?: string | string[] | null;
  selectedModel?: string | null;
  readOnly?: boolean | null;
}

export const DEFAULT_SERVER_PROFILE: ServerProfile = {
  id: DEFAULT_SERVER_ID,
  name: 'Server mặc định',
  baseUrl: '',
  apiKey: '',
  models: MODEL_OPTIONS.map((option) => option.route),
  selectedModel: MODEL_OPTIONS[0]?.route ?? '',
  readOnly: true,
};

export function normalizeServerProfile(
  input: ServerProfileInput | null | undefined,
  fallbackId: string,
): ServerProfile {
  const id = normalizeServerId(input?.id) || fallbackId;
  const models = normalizeServerModels(input?.models);
  const selectedModel = input?.selectedModel?.trim() && models.includes(input.selectedModel.trim())
    ? input.selectedModel.trim()
    : models[0] ?? '';

  return {
    id,
    name: input?.name?.trim() || (id === DEFAULT_SERVER_ID ? DEFAULT_SERVER_PROFILE.name : `Server tùy chỉnh ${serverOrdinal(id)}`),
    baseUrl: normalizeServerBaseUrl(input?.baseUrl),
    apiKey: input?.apiKey?.trim() ?? '',
    models,
    selectedModel,
    readOnly: input?.readOnly === true || id === DEFAULT_SERVER_ID,
  };
}

export function createCustomServerProfile(id: string): ServerProfile {
  return normalizeServerProfile({ id, name: `Server tùy chỉnh ${serverOrdinal(id)}` }, id);
}

export function normalizeServerBaseUrl(value: string | null | undefined): string {
  const rawValue = value?.trim() ?? '';
  if (!rawValue) {
    return '';
  }

  if (rawValue.startsWith('/') && !rawValue.startsWith('//')) {
    return rawValue.replace(/\/+$/u, '') || '/';
  }

  try {
    const url = new URL(rawValue);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '';
    }

    const path = url.pathname.replace(/\/+$/u, '');
    return `${url.origin}${path}`;
  } catch {
    return '';
  }
}

export function normalizeServerModels(value: string | string[] | null | undefined): string[] {
  const values = Array.isArray(value) ? value : (value ?? '').split(/\r?\n/u);
  const models: string[] = [];

  for (const item of values) {
    const model = item.trim();
    if (model && !isRemovedModelRoute(model) && !models.includes(model)) {
      models.push(model);
    }
  }

  return models;
}

function normalizeServerId(value: string | null | undefined): string {
  return value?.trim().replace(/[^a-zA-Z0-9_-]/gu, '-').replace(/-+/gu, '-').replace(/^-|-$/gu, '') ?? '';
}

function serverOrdinal(id: string): string {
  const match = id.match(/(\d+)$/u);
  return match?.[1] ?? '1';
}
