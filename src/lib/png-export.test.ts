import { describe, expect, it } from 'vitest';

import { exportSourceUrl, pngFilename } from './png-export';

describe('PNG export', () => {
  it('creates a safe, recognisable download filename', () => {
    expect(pngFilename('Frankenstein; Or, The Modern Prometheus')).toBe(
      'keep-these-frankenstein-or-the-modern-prometheus.png',
    );
    expect(pngFilename('Élan / “Light”')).toBe('keep-these-elan-light.png');
    expect(pngFilename('—')).toBe('keep-these-poem.png');
  });

  it('keeps a visible route back to the source in a static image', () => {
    expect(exportSourceUrl('https://www.gutenberg.org/ebooks/42324')).toBe(
      'www.gutenberg.org/ebooks/42324',
    );
  });
});
