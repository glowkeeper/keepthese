import { describe, expect, it } from 'vitest';

import {
  breadcrumbStructuredData,
  websiteStructuredData,
} from './structured-data';

const site = new URL('https://keepthese.com');

describe('search structured data', () => {
  it('describes the visible site without claiming a literary work', () => {
    expect(websiteStructuredData(site, 'A quiet poetry studio.')).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      description: 'A quiet poetry studio.',
      name: 'Keep These',
      url: 'https://keepthese.com/',
    });
  });

  it('matches the visible two-level discovery breadcrumb', () => {
    expect(
      breadcrumbStructuredData(site, 'Persuasion', '/passages/persuasion/'),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          item: 'https://keepthese.com/',
          name: 'Keep These',
          position: 1,
        },
        {
          '@type': 'ListItem',
          item: 'https://keepthese.com/passages/persuasion/',
          name: 'Persuasion',
          position: 2,
        },
      ],
    });
  });
});
