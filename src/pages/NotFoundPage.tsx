import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'

export function NotFoundPage() {
  return (
    <section className="page">
      <Card
        className="placeholder-card"
        title="404 - Page Not Found"
        description="The route you requested does not exist in this app."
        footer={
          <Link className="inline-link" to="/">
            Return home
          </Link>
        }
      />
    </section>
  )
}
