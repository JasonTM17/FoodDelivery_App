import { describe, expect, it } from 'vitest';
import { canonicalizeCuisineValues } from '@/components/settings/profile-form-fields';

describe('canonicalizeCuisineValues', () => {
  it('maps legacy accented cuisine labels to stable profile values', () => {
    expect(canonicalizeCuisineValues(['Việt Nam', 'Hải sản', 'Bánh mì'])).toEqual([
      'vietnamese',
      'seafood',
      'banh_mi',
    ]);
  });

  it('keeps unknown cuisine values so profile saves do not drop existing data', () => {
    expect(canonicalizeCuisineValues(['regional-special'])).toEqual(['regional-special']);
  });
});
