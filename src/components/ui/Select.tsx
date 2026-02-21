import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
  helperText?: string
  label: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { children, className, error, helperText, id, label, name, ...props },
  ref,
) {
  const selectId = id ?? name

  return (
    <div className="field-group">
      <label className="field-label" htmlFor={selectId}>
        {label}
      </label>
      <select
        {...props}
        className={mergeClasses('field-control', className)}
        id={selectId}
        name={name}
        ref={ref}
      >
        {children}
      </select>
      {error ? <p className="field-error">{error}</p> : null}
      {!error && helperText ? <p className="field-helper">{helperText}</p> : null}
    </div>
  )
})

function mergeClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}
