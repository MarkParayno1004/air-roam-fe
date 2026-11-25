import { useQuery } from "@tanstack/react-query";
import { useLoaderData, type ClientLoaderFunctionArgs } from "react-router";
import { CountryList } from "../catalog/CountryList";
import { ChooseCountry } from "../home/ChooseCountry";
import { Faq } from "../home/Faq";
import { Hero } from "../home/Hero";
import { HowItWorks } from "../home/HowItWorks";
import { ProductChooser } from "../home/ProductChooser";
import { soldTypes } from "../home/sold";
import { fetchProductsPage as load } from "../lib/catalog";
import { liveOrPrerendered } from "../lib/loaders";
import { buildMeta } from "../seo/meta";

export const loader = () => load(); // build time (pre-render)
export const clientLoader = ({ serverLoader }: ClientLoaderFunctionArgs) => liveOrPrerendered(load, () => serverLoader<Awaited<ReturnType<typeof load>>>());

export const meta = () =>
  buildMeta({
    title: "Land online: eSIM, SIM & Pocket WiFi in PHP · Air Roam",
    description: "Choose an eSIM, SIM or Pocket WiFi priced in pesos and pay with a card, GCash or Maya. eSIM installs before you fly; SIM and Pocket WiFi are delivered.",
    path: "/",
  });

export default function Home() {
  const initial = useLoaderData<typeof load>();
  const { data: { destinations, products } } = useQuery({ queryKey: ["home"], queryFn: load, initialData: initial });
  const types = soldTypes(products);

  return (
    <>
      <Hero destinations={destinations} types={types} />
      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-5 py-14 md:gap-24 md:px-10 md:py-20">
        <CountryList destinations={destinations} />
        <ProductChooser destinations={destinations} types={types} />
      </div>
      <HowItWorks types={types} />
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-10 md:py-20"><Faq types={types} /></div>
      <section className="bg-primary text-on-primary">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 py-14 md:flex-row md:items-center md:justify-between md:px-10 md:py-16">
          <div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl"><span className="inline-block">Your flight is booked.</span> <span className="inline-block text-accent">Is your data?</span></h2>
            <p className="mt-3 text-lg">See the price in pesos before you decide.</p>
          </div>
          <ChooseCountry destinations={destinations} />
        </div>
      </section>
    </>
  );
}
