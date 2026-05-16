declare module "bun:test" {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void): void;

  interface Matchers {
    toBe(expected: unknown): void;
    toBeTruthy(): void;
    toBeGreaterThan(expected: number): void;
    toBeUndefined(): void;
  }

  export function expect(actual: unknown): Matchers;
}
