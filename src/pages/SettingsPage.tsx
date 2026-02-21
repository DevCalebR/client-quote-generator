import { Card } from '../components/ui/Card'

export function SettingsPage() {
  return (
    <section className="page">
      <header className="page__header">
        <h1>Settings</h1>
        <p>Workspace defaults and export preferences (placeholder).</p>
      </header>

      <div className="grid grid--2">
        <Card
          className="placeholder-card"
          title="Defaults"
          description="Future step: configure default currency, tax rate, and payment terms."
        />
        <Card
          className="placeholder-card"
          title="Integrations"
          description="Future step: connect CRM, accounting tools, and PDF export options."
        />
      </div>
    </section>
  )
}
