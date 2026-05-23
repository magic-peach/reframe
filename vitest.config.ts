import { defineConfig } from 'vitest/config'

export default defineConfig({
<<<<<<< HEAD
  oxc: {
    jsx: {
      runtime: 'automatic',
    },
  },
=======
>>>>>>> c0e5715 (feat: added mobile responsiveness to upload page)
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
  },
})
