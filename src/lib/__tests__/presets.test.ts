import { getPresetById, PRESETS } from '../presets';

describe('getPresetById', () => {
  it('should return the correct preset for a valid ID', () => {
    const preset = getPresetById('vertical-9-16');
    expect(preset).toBeDefined();
    expect(preset?.id).toBe('vertical-9-16');
    expect(preset?.label).toBe('9 : 16');
    expect(preset?.platform).toBe('Reels · TikTok · Shorts');
    expect(preset?.width).toBe(1080);
    expect(preset?.height).toBe(1920);
  });

  it('should return the correct preset for square format', () => {
    const preset = getPresetById('square-1-1');
    expect(preset?.label).toBe('1 : 1');
    expect(preset?.width).toBe(1080);
    expect(preset?.height).toBe(1080);
  });

  it('should return the correct preset for landscape format', () => {
    const preset = getPresetById('landscape-16-9');
    expect(preset?.platform).toBe('YouTube · Landscape');
    expect(preset?.width).toBe(1920);
    expect(preset?.height).toBe(1080);
  });

  it('should return the custom preset', () => {
    const preset = getPresetById('custom');
    expect(preset?.label).toBe('Custom');
    expect(preset?.platform).toBe('Set your own');
  });

  it('should return undefined for an invalid ID', () => {
    const preset = getPresetById('non-existent-id');
    expect(preset).toBeUndefined();
  });

  it('should return undefined for empty string', () => {
    const preset = getPresetById('');
    expect(preset).toBeUndefined();
  });

  it('should return a preset for every ID in PRESETS', () => {
    PRESETS.forEach((preset) => {
      const found = getPresetById(preset.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(preset.id);
    });
  });
});
