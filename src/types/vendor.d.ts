declare module "@ffmpeg/ffmpeg" {
  export interface FFmpegLoadOptions {
    coreURL: string;
    wasmURL: string;
  }

  export interface FFmpegExecOptions {
    signal?: AbortSignal;
  }

  export class FFmpeg {
    loaded: boolean;
    load(options: FFmpegLoadOptions, config?: FFmpegExecOptions): Promise<void>;
    terminate(): void;
    writeFile(path: string, data: unknown, config?: FFmpegExecOptions): Promise<void>;
    readFile(path: string, encoding?: unknown, config?: FFmpegExecOptions): Promise<unknown>;
    exec(args: string[], timeout?: unknown, config?: FFmpegExecOptions): Promise<number>;
    deleteFile(path: string): Promise<void>;
    on(event: string, callback: (...args: any[]) => void): void;
    off(event: string, callback: (...args: any[]) => void): void;
  }
}

declare module "@ffmpeg/util" {
  export function fetchFile(file: Blob | File | string): Promise<Uint8Array>;
  export function toBlobURL(url: string, mimeType: string): Promise<string>;
}

declare module "wasm-feature-detect" {
  export function simd(): Promise<boolean>;
}