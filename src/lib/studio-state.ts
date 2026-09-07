export type PassageSegment =
  { kind: 'text'; text: string } | { id: string; kind: 'word'; text: string };

export interface StudioState {
  announcement: string;
  blackout: boolean;
  history: string[][];
  selectedIds: string[];
}

export type StudioAction =
  | {
      allWordIds: string[];
      tokenId: string;
      tokenText: string;
      type: 'toggle-word';
    }
  | { type: 'toggle-blackout' }
  | { blackout: boolean; selectedIds: string[]; type: 'restore' }
  | { type: 'undo' }
  | { type: 'restart' };

const wordPattern = /[\p{L}\p{N}]+(?:[’'][\p{L}\p{N}]+)*/gu;

export const initialStudioState: StudioState = {
  announcement: 'No words kept yet.',
  blackout: false,
  history: [],
  selectedIds: [],
};

export function segmentPassage(
  text: string,
  startingWordIndex = 0,
): PassageSegment[] {
  const segments: PassageSegment[] = [];
  let cursor = 0;
  let wordIndex = startingWordIndex;

  for (const match of text.matchAll(wordPattern)) {
    const index = match.index;

    if (index > cursor) {
      segments.push({ kind: 'text', text: text.slice(cursor, index) });
    }

    segments.push({
      id: `word-${wordIndex}`,
      kind: 'word',
      text: match[0],
    });
    cursor = index + match[0].length;
    wordIndex += 1;
  }

  if (cursor < text.length) {
    segments.push({ kind: 'text', text: text.slice(cursor) });
  }

  return segments;
}

export function segmentPassages(paragraphs: string[]): PassageSegment[][] {
  let nextWordIndex = 0;

  return paragraphs.map((paragraph) => {
    const segments = segmentPassage(paragraph, nextWordIndex);
    nextWordIndex += segments.filter(({ kind }) => kind === 'word').length;
    return segments;
  });
}

export function studioReducer(
  state: StudioState,
  action: StudioAction,
): StudioState {
  switch (action.type) {
    case 'toggle-word': {
      const isSelected = state.selectedIds.includes(action.tokenId);
      const selected = isSelected
        ? state.selectedIds.filter((id) => id !== action.tokenId)
        : [...state.selectedIds, action.tokenId];
      const selectedSet = new Set(selected);
      const selectedIds = action.allWordIds.filter((id) => selectedSet.has(id));

      return {
        ...state,
        announcement: isSelected
          ? `${action.tokenText} removed. ${selectedIds.length} ${selectedIds.length === 1 ? 'word' : 'words'} kept.`
          : `${action.tokenText} kept. ${selectedIds.length} ${selectedIds.length === 1 ? 'word' : 'words'} kept.`,
        history: [...state.history, state.selectedIds],
        selectedIds,
      };
    }
    case 'toggle-blackout':
      return {
        ...state,
        announcement: state.blackout
          ? 'The full page is visible again.'
          : 'Unkept words have fallen away.',
        blackout: !state.blackout,
      };
    case 'restore':
      return {
        ...initialStudioState,
        announcement: `Saved work recovered. ${action.selectedIds.length} ${
          action.selectedIds.length === 1 ? 'word' : 'words'
        } kept.`,
        blackout: action.blackout,
        selectedIds: action.selectedIds,
      };
    case 'undo': {
      const previous = state.history.at(-1);
      if (!previous) return state;

      return {
        ...state,
        announcement: `Last choice undone. ${previous.length} ${previous.length === 1 ? 'word' : 'words'} kept.`,
        history: state.history.slice(0, -1),
        selectedIds: previous,
      };
    }
    case 'restart':
      return {
        ...initialStudioState,
        announcement: 'The page has been restarted. No words are kept.',
      };
  }
}
