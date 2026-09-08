import { describe, expect, it } from 'vitest';
import { readSettingsRoute, settingsRouteUrl } from './settings-route';

describe('settings routes', () => {
  it('parses the server list and server detail paths', () => {
    expect(readSettingsRoute('/settings/servers')).toEqual({ page: 'servers' });
    expect(readSettingsRoute('/settings/servers/custom-2')).toEqual({
      page: 'server-detail',
      serverId: 'custom-2',
    });
  });

  it('rejects conversation and malformed settings paths', () => {
    expect(readSettingsRoute('/conversation/abc')).toBeNull();
    expect(readSettingsRoute('/settings/servers/')).toEqual({ page: 'servers' });
    expect(readSettingsRoute('/settings/servers/custom/id')).toBeNull();
  });

  it('creates canonical browser paths', () => {
    expect(settingsRouteUrl({ page: 'servers' })).toBe('/settings/servers');
    expect(settingsRouteUrl({ page: 'server-detail', serverId: 'custom-2' })).toBe('/settings/servers/custom-2');
  });
});
