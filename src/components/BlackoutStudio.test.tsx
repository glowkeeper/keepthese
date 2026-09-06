import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import passageRecord from '../content/passages/frankenstein-1831-chapter-4.json';
import { passageSchema } from '../lib/passage-schema';
import BlackoutStudio from './BlackoutStudio';

const passage = passageSchema.parse(passageRecord);

afterEach(cleanup);

describe('blackout studio', () => {
  it('renders the verified passage and builds a semantic poem in source order', () => {
    render(<BlackoutStudio passage={passage} />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Keep death' })[0]!);
    fireEvent.click(screen.getByRole('button', { name: 'Keep Life' }));

    expect(screen.getByLabelText('Your poem text').textContent).toBe(
      'Life death',
    );
    expect(
      screen
        .getByRole('button', { name: 'Remove Life' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('offers correction, restart, blackout, and source attribution', () => {
    render(<BlackoutStudio passage={passage} />);

    fireEvent.click(screen.getByRole('button', { name: 'Keep Life' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Let the rest fall away' }),
    );

    expect(screen.getByLabelText('Source passage').className).toContain(
      'source-page--blackout',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByLabelText('Your poem text').textContent).toBe(
      'Your chosen words will gather here.',
    );
    expect(
      screen
        .getByRole('link', { name: passage.attribution.sourceLabel })
        .getAttribute('href'),
    ).toBe(passage.source.recordUrl);
  });
});
