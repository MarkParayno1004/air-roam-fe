import { ApiError, type OrderLine } from "@air-roam/api";
import { Button, Field } from "@air-roam/ui";
import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { addDays, manilaDate, rentalDays, toApiDate, todayISO } from "../cart/rental";
import { CountryPicker } from "../components/CountryPicker";

/** Choose (POST) or edit (PATCH) travel dates — and countries for packs — for an eSIM/SIM line. */
export function BookingForm({ line, onDone }: { line: OrderLine; onDone: () => void }) {
  const { client } = useAuth();
  const b = line.booking;
  const [start, setStart] = useState(b ? manilaDate(b.start_at) : "");
  const [end, setEnd] = useState(b ? manilaDate(b.end_at) : "");
  const [countries, setCountries] = useState<string[]>(b?.destination_country_codes ?? line.countries_snapshot);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const today = todayISO();

  function onStart(v: string) {
    setStart(v);
    if (v && (!end || end <= v)) setEnd(addDays(v, 1)); // keep the range valid; the traveler can adjust
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!start || !end) return setError("Choose a start and end date.");
    if (rentalDays(start, end) < 1) return setError("The end date must be after the start date.");
    setSaving(true);
    try {
      const json = { start_at: toApiDate(start), end_at: toApiDate(end), destination_country_codes: countries };
      if (b) await client.request(`bookings/${b.id}`, { method: "PATCH", json });
      else await client.request(`order-lines/${line.id}/booking`, { method: "POST", json });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError && err.detail ? err.detail : "We couldn't save your dates. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date" type="date" min={today} value={start} onChange={(e) => onStart(e.target.value)} />
        <Field label="End date" type="date" min={start || today} value={end} onChange={(e) => setEnd(e.target.value)} />
      </div>
      {line.countries_snapshot.length > 1 && <CountryPicker countries={line.countries_snapshot} value={countries} onChange={setCountries} />}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={saving}>{b ? "Save dates" : "Confirm booking"}</Button>
        <Button type="button" size="lg" variant="secondary" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}
