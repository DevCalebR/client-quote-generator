import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean
  variant?: ButtonVariant
}

export function Button({
  className,
  fullWidth = false,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={mergeClasses(
        'btn',
        `btn--${variant}`,
        fullWidth && 'btn--full',
        className,
      )}
      type={type}
      {...props}
    />
  )
}

function mergeClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}
