import { Card } from "@air-roam/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLoaderData, useNavigate, type ClientLoaderFunctionArgs } from "react-router";
import { liveOrPrerendered } from "../lib/loaders";
import { PopularDestinations } from "../catalog/PopularDestinations";
import { fetchDestinations } from "../lib/catalog";
import { buildMeta } from "../seo/meta";

async function load() {
  return { destinations: await fetchDestinations() };
}
export const loader = load; // build time (pre-render)
export const clientLoader = ({ serverLoader }: ClientLoaderFunctionArgs) => liveOrPrerendered(load, () => serverLoader<Awaited<ReturnType<typeof load>>>());

export const meta = () =>
  buildMeta({
    title: "Air Roam — eSIM, SIM & Pocket WiFi for travelers",
    description: "Roaming data for your next trip: eSIM, SIM or Pocket WiFi rental. Pay in PHP with Xendit, ready before you fly.",
    path: "/",
  });

const TYPES = [
  ["eSIM", "Instant install, no card swapping"],
  ["SIM", "Physical SIM delivered to you"],
  ["Pocket WiFi", "Rent a device, share with your group"],
] as const;

const STEPS = [
  ["1  Choose a plan", "Pick a destination and an eSIM, SIM or Pocket WiFi."],
  ["2  Pay with Xendit", "Cards, GCash, Maya and more — charged in PHP."],
  ["3  Connect", "Pocket WiFi is booked for your dates; eSIM and SIM start on activation."],
] as const;

export default function Home() {
  const initial = useLoaderData<typeof load>();
  const { data } = useQuery({ queryKey: ["home"], queryFn: load, initialData: initial });
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  return (
    <>
      <section className="bg-primary-soft">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-14 md:px-10 md:py-20">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold leading-tight md:text-5xl">Roaming data for your next trip</h1>
            <p className="mt-4 text-base text-muted md:text-lg">eSIM, SIM or Pocket WiFi rental — pay in PHP with Xendit, ready before you fly.</p>
          </div>
          <form
            role="search"
            className="flex max-w-3xl flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/destinations${q ? `?q=${encodeURIComponent(q)}` : ""}`);
            }}
          >
            <label htmlFor="hero-search" className="sr-only">Where are you going?</label>
            <input
              id="hero-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Where are you going? e.g. Japan"
              className="h-14 flex-1 rounded-input border border-border bg-surface px-5 text-base outline-none focus:border-primary"
            />
            <button type="submit" className="h-14 cursor-pointer rounded-input bg-primary px-8 font-semibold text-on-primary hover:bg-primary/90">Find plans</button>
          </form>
          <ul className="grid gap-4 sm:grid-cols-3">
            {TYPES.map(([t, d]) => (
              <li key={t}>
                <Card className="flex items-center gap-4 p-4">
                  <span aria-hidden className="flex size-12 items-center justify-center rounded-tile bg-primary-soft text-lg font-bold text-primary">{t[0]}</span>
                  <div>
                    <p className="font-semibold">{t}</p>
                    <p className="text-xs text-muted">{d}</p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-5 py-14 md:px-10">
        <PopularDestinations destinations={data.destinations} />

        <section aria-labelledby="how" className="flex flex-col gap-5">
          <h2 id="how" className="text-2xl font-bold">How it works</h2>
          <ol className="grid gap-5 md:grid-cols-3">
            {STEPS.map(([t, d]) => (
              <li key={t}>
                <Card className="h-full p-6">
                  <p className="text-[17px] font-semibold">{t}</p>
                  <p className="mt-2 text-[13px] text-muted">{d}</p>
                </Card>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
