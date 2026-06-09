import React from 'react'
import { describe, beforeEach, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '../ThemeProvider'
import { ThemeToggle } from '../ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('toggles theme and persists choice', async () => {
    render(
      React.createElement(
        ThemeProvider,
        null,
        React.createElement(ThemeToggle)
      )
    )

    const btn = screen.getByRole('button')
    expect(btn).toBeTruthy()

    await userEvent.click(btn)

    // After first toggle (light -> dark) the `dark` class should be set
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('theme')).toBe('dark')

    // Toggle again (dark -> light) should update storage
    await userEvent.click(btn)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('theme')).toBe('light')
  })
})
