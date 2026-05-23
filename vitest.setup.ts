// Vitest setup: polyfills and global mocks
import '@testing-library/jest-dom/vitest'
<<<<<<< HEAD

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
=======
>>>>>>> c0e5715 (feat: added mobile responsiveness to upload page)
