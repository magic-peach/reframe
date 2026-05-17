import { describe, it, expect } from 'vitest';
import { getPresetById, PRESETS } from './presets';

describe('getPresetById', () => {
  it('should return the correct preset for valid IDs', () => {
    const verticalPreset = getPresetById('vertical-9-16');
    expect(verticalPreset).toBeDefined();
    expect(verticalPreset?.label).toBe('9 : 16');
    expect(verticalPreset?.width).toBe(1080);
    expect(verticalPreset?.height).toBe(1920);

    const landscapePreset = getPresetById('landscape-16-9');
    expect(landscapePreset).toBeDefined();
    expect(landscapePreset?.label).toBe('16 : 9');
    expect(landscapePreset?.width).toBe(1920);
    expect(landscapePreset?.height).toBe(1080);

    const squarePreset = getPresetById('square-1-1');
    expect(squarePreset).toBeDefined();
    expect(squarePreset?.width).toBe(1080);
    expect(squarePreset?.height).toBe(1080);
  });

  it('should return all PRESETS with correct structure', () => {
    expect(PRESETS.length).toBe(11);
    PRESETS.forEach((preset) => {
      expect(preset).toHaveProperty('id');
      expect(preset).toHaveProperty('label');
      expect(preset).toHaveProperty('platform');
      expect(preset).toHaveProperty('width');
      expect(preset).toHaveProperty('height');
      expect(typeof preset.width).toBe('number');
      expect(typeof preset.height).toBe('number');
      expect(preset.width).toBeGreaterThan(0);
      expect(preset.height).toBeGreaterThan(0);
    });
  });

  it('should return undefined for invalid IDs', () => {
    expect(getPresetById('non-existent-id')).toBeUndefined();
    expect(getPresetById('')).toBeUndefined();
    expect(getPresetById('random')).toBeUndefined();
  });

  it('should return custom preset correctly', () => {
    const custom = getPresetById('custom');
    expect(custom).toBeDefined();
    expect(custom?.platform).toBe('Set your own');
    expect(custom?.width).toBe(1920);
    expect(custom?.height).toBe(1080);
  });
});
