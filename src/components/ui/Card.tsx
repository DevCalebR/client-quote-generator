import type { PropsWithChildren, ReactNode } from 'react'

interface CardProps extends PropsWithChildren {
  className?: string
  description?: string
  footer?: ReactNode
  title?: string
}

export function Card({ children, className, description, footer, title }: CardProps) {
  return (
    <section className={mergeClasses('card', className)}>
      {title ? <h2 className="card__title">{title}</h2> : null}
      {description ? <p className="card__description">{description}</p> : null}
      {children ? <div className="card__content">{children}</div> : null}
      {footer ? <div className="card__footer">{footer}</div> : null}
    </section>
  )
}

function mergeClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}
