import { useState, type FormEvent } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Select } from '../components/ui/Select'
import {
  getSettings,
  getSupportedCurrencies,
  saveSettings,
  type AppSettings,
} from '../features/settings/storage'

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(() => getSettings())
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const persistedSettings = saveSettings(settings)
      setSettings(persistedSettings)
      setSaveSuccess('Settings saved.')
    } catch {
      setSaveError('Unable to save settings right now. Please try again.')
    }
  }

  const currencyOptions = getSupportedCurrencies()

  return (
    <section className="page">
      <header className="page__header">
        <h1>Settings</h1>
        <p>Workspace defaults for quote currency and client-facing currency display.</p>
      </header>

      <Card
        title="Currency Settings"
        description="Configure how totals are saved and displayed for client conversion previews."
      >
        <form className="form" onSubmit={handleSave}>
          <div className="grid grid--2">
            <Select
              label="Base Currency"
              value={settings.baseCurrency}
              onChange={(event) =>
                setSettings((currentSettings) => ({
                  ...currentSettings,
                  baseCurrency: event.target.value as AppSettings['baseCurrency'],
                }))
              }
            >
              {currencyOptions.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </Select>

            <Select
              label="Client Currency"
              value={settings.clientCurrency}
              onChange={(event) =>
                setSettings((currentSettings) => ({
                  ...currentSettings,
                  clientCurrency: event.target.value as AppSettings['clientCurrency'],
                }))
              }
            >
              {currencyOptions.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </Select>
          </div>

          <p className="muted">
            Conversion uses live FX rates with cache. If the provider is unavailable, quote creation
            still works and conversion UI falls back gracefully.
          </p>

          <div className="form__actions">
            <Button type="submit">Save Settings</Button>
          </div>
        </form>
      </Card>

      {saveSuccess ? <Card className="card--inset" title="Saved" description={saveSuccess} /> : null}
      {saveError ? (
        <Card className="placeholder-card" title="Save Error" description={saveError} />
      ) : null}
    </section>
  )
}
