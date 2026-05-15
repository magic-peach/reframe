import { formatBytes } from '../ffmpeg';

describe('formatBytes', () => {
  it('should format bytes less than 1 MB as KB', () => {
    expect(formatBytes(512)).toBe('0.5 KB');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(512 * 1024)).toBe('512.0 KB');
  });

  it('should format bytes greater than or equal to 1 MB as MB', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB');
    expect(formatBytes(10.5 * 1024 * 1024)).toBe('10.5 MB');
  });

  it('should handle edge case of 0 bytes', () => {
    expect(formatBytes(0)).toBe('0.0 KB');
  });

  it('should handle very large files', () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1024.0 MB');
  });
});
