import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/dom'
import FileUpload from '../FileUpload'

function createDocumentDragEvent(type: string, dataTransferTypes: string[]) {
  const event = new Event(type, { bubbles: true, cancelable: true })

  Object.defineProperty(event, 'dataTransfer', {
    value: {
      types: dataTransferTypes,
      files: [],
    },
  })

  return event
}

describe('FileUpload page drag overlay', () => {
  const currentFile = new File(['video'], 'sample.mp4', { type: 'video/mp4' })

  it('ignores document drag events that are not file drags', () => {
    render(
      <FileUpload
        onFileSelect={vi.fn()}
        currentFile={currentFile}
        fileError=""
        duration={10}
      />
    )

    fireEvent(document, createDocumentDragEvent('dragenter', ['text/plain']))

    expect(screen.queryByText('Drop your video anywhere')).not.toBeInTheDocument()
  })

  it('shows the page overlay for document file drags', () => {
    render(
      <FileUpload
        onFileSelect={vi.fn()}
        currentFile={currentFile}
        fileError=""
        duration={10}
      />
    )

    fireEvent(document, createDocumentDragEvent('dragenter', ['Files']))

    expect(screen.getByText('Drop your video anywhere')).toBeInTheDocument()
  })
})
