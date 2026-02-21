import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'

export function HomePage() {
  return (
    <section className="page">
      <header className="page__header">
        <h1>Client Intake + Quote Generator</h1>
        <p>
          Start from intake details, generate a quote, and review saved drafts from
          local storage.
        </p>
      </header>

      <div className="grid grid--3">
        <Card
          description="Capture client and project details, then generate a quote draft."
          title="Create a New Quote"
          footer={
            <Link className="inline-link" to="/intake">
              Open intake form
            </Link>
          }
        />
        <Card
          description="View all saved quotes and navigate into quote details."
          title="Review Quotes"
          footer={
            <Link className="inline-link" to="/quotes">
              Open quote list
            </Link>
          }
        />
        <Card
          description="Adjust future defaults and workspace preferences."
          title="Project Settings"
          footer={
            <Link className="inline-link" to="/settings">
              Open settings
            </Link>
          }
        />
      </div>

      <Card
        className="placeholder-card"
        title="Loading and Error States"
        description="Each route includes explicit loading, empty, or error placeholders so the UI never renders as a blank page."
      />
    </section>
  )
}
