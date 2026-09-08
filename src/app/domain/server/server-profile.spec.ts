import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SERVER_PROFILE,
  createCustomServerProfile,
  normalizeServerProfile,
} from './server-profile';

describe('server profiles', () => {
  it('normalizes a custom server without exposing its secret in the display data', () => {
    const profile = normalizeServerProfile({
      id: ' custom-one ',
      name: '  Local 9Router ',
      baseUrl: ' http://127.0.0.1:8045/v1/// ',
      apiKey: ' sk-test ',
      models: [' kr/glm-5 ', 'kr/glm-5', ''],
      selectedModel: 'kr/glm-5',
    }, 'custom-one');

    expect(profile).toEqual({
      id: 'custom-one',
      name: 'Local 9Router',
      baseUrl: 'http://127.0.0.1:8045/v1',
      apiKey: 'sk-test',
      models: ['kr/glm-5'],
      selectedModel: 'kr/glm-5',
      readOnly: false,
    });
  });

  it('creates a usable empty custom server with a stable id', () => {
    expect(createCustomServerProfile('custom-2')).toMatchObject({
      id: 'custom-2',
      name: 'Server tùy chỉnh 2',
      baseUrl: '',
      models: [],
      selectedModel: '',
      readOnly: false,
    });
  });

  it('keeps the built-in server read-only and model-ready', () => {
    expect(DEFAULT_SERVER_PROFILE).toMatchObject({
      id: 'default',
      readOnly: true,
      baseUrl: '',
      models: expect.arrayContaining(['deepseek/deepseek-v4-flash']),
    });
  });
});
