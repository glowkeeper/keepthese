import type { Passage } from './passage-schema';

export function formatPassageAttribution(passage: Passage): string {
  const { work, passageLocation, source } = passage;

  return `${work.title} by ${work.author.name} (${work.firstPublishedYear}), ${passageLocation.edition}, ${passageLocation.chapter}. Source: ${source.provider} eBook #${source.ebookNumber}.`;
}
