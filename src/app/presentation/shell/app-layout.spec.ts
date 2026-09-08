import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const shellStyles = readFileSync(resolve(process.cwd(), 'src/app/presentation/shell/app.css'), 'utf8');
const globalStyles = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');
const shellTemplate = readFileSync(resolve(process.cwd(), 'src/app/presentation/shell/app.html'), 'utf8');

describe('chat shell visual contract', () => {
  it('keeps assistant messages transparent and reserves the tinted surface for user bubbles', () => {
    expect(shellStyles).toMatch(/\.assistant-row \.message-bubble\s*\{[\s\S]*?background:\s*transparent/);
    expect(globalStyles).toMatch(/\.app-shell\.dark-mode \.message-bubble\s*\{[\s\S]*?background:\s*transparent !important/);
    expect(globalStyles).toMatch(/\.app-shell\.dark-mode \.user-row \.message-bubble\s*\{[\s\S]*?background:\s*#1f2937 !important/);
  });

  it('keeps the desktop content rail and fixed composer aligned', () => {
    expect(shellStyles).toMatch(/\.conversation\s*\{[\s\S]*?width:\s*min\(100%,\s*var\(--content-rail\)\)/);
    expect(shellStyles).toMatch(/\.composer\s*\{[\s\S]*?width:\s*min\(calc\(100% - 40px\),\s*var\(--content-rail\)\)/);
    expect(globalStyles).toMatch(/\.chat-footer\s*\{[\s\S]*?position:\s*fixed/);
  });

  it('gives the server menu enough room for absolute endpoint URLs', () => {
    expect(shellStyles).toMatch(/\.server-menu\s*\{[\s\S]*?width:\s*min\(460px,/);
    expect(shellStyles).toMatch(/\.server-menu-option strong\s*\{[\s\S]*?overflow-wrap:\s*anywhere/);
    expect(globalStyles).toMatch(/\.app-shell\.dark-mode \.server-menu\s*\{[\s\S]*?background:\s*#1f2937 !important/);
  });

  it('keeps customize form surfaces and labels readable in dark mode', () => {
    expect(globalStyles).toMatch(/\.app-shell\.dark-mode \.setup-field,\s*\.app-shell\.dark-mode \.connection-card/);
    expect(globalStyles).toMatch(/\.app-shell\.dark-mode \.setup-field > span,[\s\S]*?color:\s*#f3f6fb !important/);
    expect(globalStyles).toMatch(/\.app-shell\.dark-mode \.setup-field small,[\s\S]*?color:\s*#aebbd0 !important/);
    expect(globalStyles).toMatch(/\.app-shell\.dark-mode \.setup-heading > p:not\(\.eyebrow\),[\s\S]*?color:\s*#aebbd0 !important/);
  });

  it('uses a softer dark palette and stronger light-theme secondary text', () => {
    expect(globalStyles).toMatch(/\.app-shell\.dark-mode \.chat-card,[\s\S]*?background:\s*#162338 !important/);
    expect(globalStyles).toMatch(/\.app-shell\.dark-mode \.setup-field small,[\s\S]*?color:\s*#c4d0e0 !important/);
    expect(globalStyles).toMatch(/\.app-shell:not\(\.dark-mode\) \.setup-field small,[\s\S]*?color:\s*#526176/);
  });

  it('keeps server settings separate from conversation tabs', () => {
    expect(shellTemplate).toMatch(/id="servers-panel"/);
    expect(shellTemplate).toMatch(/openServerSettings\(\)/);
    expect(shellTemplate).toMatch(/class="settings-nav"/);
    expect(shellTemplate).not.toContain('Mở Customize để sửa server');
  });

  it('uses compact server labels and protects server cards on mobile', () => {
    expect(shellStyles).toMatch(/\.server-button-label\s*\{[\s\S]*?text-overflow:\s*ellipsis/);
    expect(shellStyles).toMatch(/\.server-profile-card,\s*\.server-list-empty\s*\{[\s\S]*?border-radius:\s*15px/);
    expect(shellStyles).toMatch(/\.server-profile-card,\s*\.server-list-empty\s*\{[\s\S]*?flex-direction:\s*column/);
  });
});
