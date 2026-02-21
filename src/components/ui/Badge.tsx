import type { PropsWithChildren } from 'react'

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger'

interface BadgeProps extends PropsWithChildren {
  variant?: BadgeVariant
}

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  return <span className={`badge badge--${variant}`}>{children}</span>
}
