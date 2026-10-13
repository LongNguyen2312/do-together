/**
 * A voice note's waveform: the loudness readings taken while recording,
 * squeezed into a fixed number of bars, the loudest one full height.
 */
import { WAVEFORM_BARS, waveformOf } from '@/services/audio';

describe('waveformOf', () => {
  it('is empty when nothing was heard', () => {
    expect(waveformOf([])).toEqual([]);
  });

  it('always has the same number of bars, short or long', () => {
    expect(waveformOf([0.2, 0.5])).toHaveLength(WAVEFORM_BARS);
    expect(
      waveformOf(Array.from({ length: 300 }, (_, i) => (i % 10) / 10)),
    ).toHaveLength(WAVEFORM_BARS);
  });

  it('keeps each slice at its loudest, scaled to the loudest bar', () => {
    expect(waveformOf([0.1, 0.4, 0.2, 0.2], 2)).toEqual([1, 0.5]);
  });

  it('stays between 0 and 1', () => {
    const wave = waveformOf([0, 0.05, 0.3, 0.9, 0.6]);
    expect(Math.max(...wave)).toBe(1);
    expect(Math.min(...wave)).toBeGreaterThanOrEqual(0);
  });
});
