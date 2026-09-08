export type SettingsRoute =
  | { page: 'servers' }
  | { page: 'server-detail'; serverId: string };

export function readSettingsRoute(pathname: string): SettingsRoute | null {
  const normalized = pathname.replace(/\/+$/u, '') || '/';
  if (normalized === '/settings/servers') {
    return { page: 'servers' };
  }

  const match = normalized.match(/^\/settings\/servers\/([a-zA-Z0-9_-]+)$/u);
  return match ? { page: 'server-detail', serverId: match[1] } : null;
}

export function settingsRouteUrl(route: SettingsRoute): string {
  return route.page === 'servers'
    ? '/settings/servers'
    : `/settings/servers/${encodeURIComponent(route.serverId)}`;
}
