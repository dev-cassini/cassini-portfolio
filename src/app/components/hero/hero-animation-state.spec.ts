import {
  createNextCycle,
  getReappearanceTime,
  isReappearanceDue,
  shouldTriggerRandomSequence,
} from './hero-animation-state';

describe('hero animation state', () => {
  describe('random sequence triggers', () => {
    it('triggers only during the configured highlight window when no cube is hovered', () => {
      expect(shouldTriggerRandomSequence(false, 0.32)).toBe(true);
      expect(shouldTriggerRandomSequence(false, 0.3)).toBe(false);
      expect(shouldTriggerRandomSequence(false, 0.35)).toBe(false);
    });

    it('suppresses new random sequences while any cube is hovered', () => {
      expect(shouldTriggerRandomSequence(true, 0.32)).toBe(false);
    });
  });

  describe('hidden-cube timing', () => {
    it('sets a stable reappearance time from the moment a cube disappears', () => {
      expect(getReappearanceTime(10, 0)).toBe(12);
      expect(getReappearanceTime(10, 0.5)).toBe(13);
      expect(getReappearanceTime(10, 1)).toBe(14);
    });

    it('keeps a hidden cube hidden until its scheduled reappearance time', () => {
      const reappearanceTime = getReappearanceTime(10, 0.5);

      expect(isReappearanceDue(12.99, reappearanceTime)).toBe(false);
      expect(isReappearanceDue(13, reappearanceTime)).toBe(true);
    });
  });

  describe('next cycle selection', () => {
    it('uses the supplied random values to choose the next animation and expansion direction', () => {
      expect(createNextCycle(() => 0.4)).toEqual({
        animationType: 'collapse',
        expandDirection: 'up',
      });
      expect(createNextCycle(() => 0.6)).toEqual({
        animationType: 'expand',
        expandDirection: 'down',
      });
    });
  });
});
