export function websiteStructuredData(
  site: URL,
  description: string,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    description,
    name: 'Keep These',
    url: new URL('/', site).href,
  };
}

export function breadcrumbStructuredData(
  site: URL,
  title: string,
  path: string,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        item: new URL('/', site).href,
        name: 'Keep These',
        position: 1,
      },
      {
        '@type': 'ListItem',
        item: new URL(path, site).href,
        name: title,
        position: 2,
      },
    ],
  };
}
