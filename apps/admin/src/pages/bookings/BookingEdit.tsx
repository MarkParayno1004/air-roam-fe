import type { StaffBooking, StaffBookingUpdateResponse } from "@air-roam/api";
import { Button, Field, Notice, countryName, statusLabel } from "@air-roam/ui";
import { useState } from "react";
import { useStaff } from "../../auth/StaffProvider";
import { errorMessage } from "../../lib/errors";
import { BOOKING_STATUSES } from "../../lib/options";

const manila = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date(iso));
const days = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
const WARNING = "The number of rental days changed — settle the price difference with the traveler manually.";

/** Admin edit — the only place Pocket WiFi rental dates can change. */
export function BookingEdit({ booking: b, onSaved, onClose }: { booking: StaffBooking; onSaved: () => void; onClose: () => void }) {
  const { client } = useStaff();
  const [start, setStart] = useState(manila(b.start_at));
  const [end, setEnd] = useState(manila(b.end_at));
  const [status, setStatus] = useState(b.booking_status);
  const [countries, setCountries] = useState<string[]>(b.destination_country_codes);
  const [error, setError] = useState<string | null>(null);
  const [serverWarn, setServerWarn] = useState(false);
  const rental = b.pricing_unit === "per_day";
  const changedDays = rental && b.rental_days != null && days(start, end) !== b.rental_days;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await client.request<StaffBookingUpdateResponse>(`staff/bookings/${b.id}`, {
        method: "PATCH",
        json: { start_at: `${start}T00:00:00+08:00`, end_at: `${end}T00:00:00+08:00`, booking_status: status, destination_country_codes: countries },
      });
      onSaved();
      // Keep the editor open so the backend's day-change warning is actually seen.
      if (res.rental_days_changed) setServerWarn(true);
      else onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <form aria-label={`Edit booking ${b.product_name} · ${b.variant_name}`} onSubmit={save} className="flex flex-col gap-4 rounded-input border border-border bg-background p-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Start date" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <Field label="End date" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="h-11 rounded-input border border-border bg-surface px-3 text-sm font-normal">
            {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
        </label>
      </div>
      {b.countries.length > 1 && (
        <fieldset className="flex flex-wrap gap-4 text-sm">
          <legend className="mb-1 font-medium">Destination countries</legend>
          {b.countries.map((c) => (
            <label key={c} className="flex items-center gap-2">
              <input type="checkbox" className="size-4 accent-primary" checked={countries.includes(c)} disabled={countries.includes(c) && countries.length === 1} onChange={() => setCountries((v) => (v.includes(c) ? v.filter((x) => x !== c) : [...v, c].sort()))} />
              {countryName(c)}
            </label>
          ))}
        </fieldset>
      )}
      {(changedDays || serverWarn) && <Notice tone="red" title={WARNING} />}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {serverWarn && <p role="status" className="text-sm text-success">Saved.</p>}
      <div className="flex gap-3">
        {serverWarn ? (
          <Button onClick={onClose}>Close</Button>
        ) : (
          <>
            <Button type="submit">Save booking</Button>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
          </>
        )}
      </div>
    </form>
  );
}
