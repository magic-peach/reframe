/**
 * Is this code running inside Chromatic's screenshot renderer?
 *
 * Mirrors the upstream `chromatic/isChromatic` helper, inlined so that nothing
 * in `src/` imports from the chromatic package. That package is test tooling;
 * app code reaching into it blurs a boundary worth keeping sharp, and it puts
 * a devDependency in the shipped bundle.
 *
 * (It would not, on its own, break a production-only install — `next build`
 * here already needs typescript, tailwindcss and postcss, all of which are
 * devDependencies too. The reason is the boundary, not the install.)
 *
 * The detection has been stable for years, but if it ever drifts the source of
 * truth is:
 * https://github.com/chromaui/chromatic-cli/blob/main/isChromatic.js
 *
 * Used to render animations at a fixed frame during snapshots — see
 * LottiePlayer. Returns false in the real app and in local Storybook.
 */
export function isChromatic(win?: Window): boolean {
  const target = win ?? (typeof window === "undefined" ? undefined : window);
  if (!target) return false;

  return (
    /Chromatic/.test(target.navigator.userAgent) ||
    /chromatic=true/.test(target.location.href)
  );
}

export default isChromatic;
