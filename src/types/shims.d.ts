declare namespace React {
  type ReactNode = any;
  type ReactElement = any;
  type FC<P = any> = any;
  interface RefObject<T = any> {
    current: T | null;
  }
}

declare module "react" {
  export const useState: any;
  export const useEffect: any;
  export const useRef: any;
  export const useCallback: any;
  export const useMemo: any;
  const ReactNamespace: any;
  export default ReactNamespace;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module "lucide-react";
declare module "@ffmpeg/ffmpeg";
declare module "wasm-feature-detect";

export {};
