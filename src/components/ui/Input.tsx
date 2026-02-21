import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  helperText?: string
  label: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, helperText, id, label, name, ...props },
  ref,
) {
  const inputId = id ?? name

  return (
    <div className="field-group">
      <label className="field-label" htmlFor={inputId}>
        {label}
      </label>
      <input
        {...props}
        className={mergeClasses('field-control', className)}
        id={inputId}
        name={name}
        ref={ref}
      />
      {error ? <p className="field-error">{error}</p> : null}
      {!error && helperText ? <p className="field-helper">{helperText}</p> : null}
    </div>
  )
})

function mergeClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}
