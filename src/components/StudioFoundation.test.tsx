import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import StudioFoundation from './StudioFoundation';

describe('studio foundation', () => {
  it('provides a labelled region without introducing making behaviour', () => {
    render(<StudioFoundation />);

    expect(screen.getByRole('region', { name: 'Meet the page' })).toBeDefined();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
