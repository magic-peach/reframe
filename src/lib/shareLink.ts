import type { EditRecipe } from "@/lib/types";

function encodeBytes(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBytes(encoded: string): Uint8Array {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function encodeRecipe(recipe: EditRecipe): string {
  const bytes = new TextEncoder().encode(JSON.stringify(recipe));
  return encodeBytes(bytes);
}

export function decodeRecipe(encoded: string): Partial<EditRecipe> | null {
  try {
    const json = new TextDecoder().decode(decodeBytes(encoded));
    return JSON.parse(json) as Partial<EditRecipe>;
  } catch {
    return null;
  }
}
