import type { Passage } from './passage-schema';

export interface PublicPassage {
  attribution: Pick<Passage['attribution'], 'requiredCredit' | 'sourceLabel'>;
  curation: Pick<Passage['curation'], 'context' | 'motifs'>;
  passageId: Passage['passageId'];
  passageLocation: Pick<Passage['passageLocation'], 'chapter' | 'edition'>;
  source: Pick<Passage['source'], 'recordUrl'>;
  text: Passage['text'];
  textVersion: Passage['textVersion'];
  work: {
    author: Pick<Passage['work']['author'], 'name'>;
    firstPublishedYear: Passage['work']['firstPublishedYear'];
    title: Passage['work']['title'];
  };
}

export function toPublicPassage(passage: Passage): PublicPassage {
  return {
    attribution: {
      requiredCredit: passage.attribution.requiredCredit,
      sourceLabel: passage.attribution.sourceLabel,
    },
    curation: {
      context: passage.curation.context,
      motifs: passage.curation.motifs,
    },
    passageId: passage.passageId,
    passageLocation: {
      chapter: passage.passageLocation.chapter,
      edition: passage.passageLocation.edition,
    },
    source: {
      recordUrl: passage.source.recordUrl,
    },
    text: passage.text,
    textVersion: passage.textVersion,
    work: {
      author: {
        name: passage.work.author.name,
      },
      firstPublishedYear: passage.work.firstPublishedYear,
      title: passage.work.title,
    },
  };
}
