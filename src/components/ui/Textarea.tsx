import { forwardRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  helperText?: string
  label: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { className, error, helperText, id, label, name, ...props },
    ref,
  ) {
    const textareaId = id ?? name

    return (
      <div className="field-group">
        <label className="field-label" htmlFor={textareaId}>
          {label}
        </label>
        <textarea
          {...props}
          className={mergeClasses('field-control', className)}
          id={textareaId}
          name={name}
          ref={ref}
        />
        {error ? <p className="field-error">{error}</p> : null}
        {!error && helperText ? <p className="field-helper">{helperText}</p> : null}
      </div>
    )
  },
)

function mergeClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}
