// src/utils/video-validation.ts

/**
 * Magic byte signatures for supported video formats.
 *
 * Each entry defines a byte pattern and the offset at which it appears in the
 * file header.  Reading only the first 12 bytes is enough to cover all formats
 * listed below.
 *
 * References:
 *   MP4 / MOV  – "ftyp" box at byte offset 4  (ISO 14496-12)
 *   WebM       – EBML magic bytes at offset 0  (RFC 8794 / Matroska spec)
 *   AVI        – RIFF container at offset 0    (Microsoft RIFF spec)
 *   MKV        – same EBML header as WebM
 *   OGG        – "OggS" capture pattern        (RFC 3533)
 *   FLV        – "FLV" signature at offset 0   (Adobe spec)
 *   MPEG-TS    – 0x47 sync byte at offset 0    (ISO 13818-1)
 *   MPEG (PS)  – pack-start-code at offset 0
 *   3GPP       – "ftyp3g" at byte offset 4
 */
interface MagicSignature {
  /** Human-readable format name used in error messages. */
  label: string;
  /** Byte values to match.  `null` means "skip / wildcard". */
  bytes: (number | null)[];
  /** Byte offset at which the pattern starts. */
  offset: number;
}

const VIDEO_SIGNATURES: MagicSignature[] = [
  // MP4 / MOV / M4V – "ftyp" box descriptor at byte 4
  { label: "MP4/MOV", bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },

  // WebM / MKV – EBML magic: 0x1A 0x45 0xDF 0xA3
  { label: "WebM/MKV", bytes: [0x1a, 0x45, 0xdf, 0xa3], offset: 0 },

  // AVI – RIFF header: "RIFF"
  { label: "AVI", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },

  // OGG – "OggS"
  { label: "OGG", bytes: [0x4f, 0x67, 0x67, 0x53], offset: 0 },

  // FLV – "FLV\x01"
  { label: "FLV", bytes: [0x46, 0x4c, 0x56, 0x01], offset: 0 },

  // MPEG-2 Transport Stream – sync byte 0x47
  { label: "MPEG-TS", bytes: [0x47], offset: 0 },

  // MPEG-1/2 Program Stream – pack start code 0x00 0x00 0x01 0xBA
  { label: "MPEG-PS", bytes: [0x00, 0x00, 0x01, 0xba], offset: 0 },

  // 3GPP – "ftyp3g" at offset 4
  { label: "3GPP", bytes: [0x66, 0x74, 0x79, 0x70, 0x33, 0x67], offset: 4 },
];

/** Number of bytes required to test all signatures. */
const MAGIC_BYTES_LENGTH = 12;

/**
 * Reads the first {@link MAGIC_BYTES_LENGTH} bytes of `file` and checks them
 * against known video magic-byte signatures.
 *
 * @returns `true` when the file header matches at least one video format.
 */
export async function validateVideoMagicBytes(file: File): Promise<boolean> {
  const buffer = await file.slice(0, MAGIC_BYTES_LENGTH).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  return VIDEO_SIGNATURES.some(({ bytes: pattern, offset }) =>
    pattern.every(
      (expected, i) => expected === null || bytes[offset + i] === expected
    )
  );
}

export const MAX_4K_PIXELS = 3840 * 2160; 
export const MAX_8K_PIXELS = 7680 * 7680; 

export type ValidationResult = 'safe' | 'warning' | 'blocked';

export function validateDimensions(width: number, height: number): ValidationResult {
  const pixels = width * height;
  
  if (pixels > MAX_8K_PIXELS) return 'blocked';
  if (pixels > MAX_4K_PIXELS) return 'warning';
  
  return 'safe';
}

export function getDownscaledDimensions(width: number, height: number) {
  const aspectRatio = width / height;
  const newHeight = Math.sqrt(MAX_4K_PIXELS / aspectRatio);
  const newWidth = newHeight * aspectRatio;
  
  return {
    width: Math.floor(newWidth / 2) * 2,
    height: Math.floor(newHeight / 2) * 2
  };
}