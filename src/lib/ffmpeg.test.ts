import { describe, it, expect } from 'vitest';
import { formatBytes } from './ffmpeg';

describe('formatBytes', () => {
  it('should format bytes less than 1 MB as KB', () => {
    expect(formatBytes(0)).toBe('0.0 KB');
    expect(formatBytes(512)).toBe('0.5 KB');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(512000)).toBe('500.0 KB');
    expect(formatBytes(1048575)).toBe('1024.0 KB'); // just under 1 MB
  });

  it('should format bytes equal to or greater than 1 MB as MB', () => {
    expect(formatBytes(1048576)).toBe('1.0 MB'); // exactly 1 MB
    expect(formatBytes(2097152)).toBe('2.0 MB'); // exactly 2 MB
    expect(formatBytes(5242880)).toBe('5.0 MB'); // 5 MB
    expect(formatBytes(10485760)).toBe('10.0 MB'); // 10 MB
  });

  it('should format edge cases correctly', () => {
    expect(formatBytes(1)).toBe('0.0 KB');
    expect(formatBytes(1073741824)).toBe('1024.0 MB'); // 1 GB
  });
});
