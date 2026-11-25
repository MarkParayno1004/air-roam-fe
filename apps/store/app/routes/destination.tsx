import { useQuery } from "@tanstack/react-query";
import { useLoaderData, type ClientLoaderFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { liveOrPrerendered } from "../lib/loaders";
import { DestinationView } from "../catalog/DestinationView";
import { useAddToCart } from "../catalog/useAddToCart";
import { fetchDestinationPage } from "../lib/catalog";
import { productJsonLd } from "../seo/jsonld";
import { buildMeta, destinationTitle } from "../seo/meta";

const load = ({ params }: LoaderFunctionArgs) => fetchDestinationPage(params.slug ?? "");
export const loader = load; // pre-rendered for every destination at build time
// live data for client navigation (and destinations added after the build); pre-rendered data if the API is unreachable
export const clientLoader = (args: ClientLoaderFunctionArgs) => liveOrPrerendered(() => load(args), () => args.serverLoader<Data>());

type Data = Awaited<ReturnType<typeof fetchDestinationPage>>;

export const meta = ({ data }: { data?: Data }) =>
  data
    ? [
        ...buildMeta({
          title: destinationTitle(data.destination.country_name, data.destination.from_price),
          description: `Roaming data for ${data.destination.country_name}: eSIM, SIM and Pocket WiFi rental from Air Roam. Pay in PHP.`,
          path: `/destinations/${data.destination.slug}`,
        }),
        { "script:ld+json": productJsonLd(data.destination) },
      ]
    : [{ title: "Destination not found · Air Roam" }];

export default function Destination() {
  const initial = useLoaderData<Data>();
  const { data } = useQuery({
    queryKey: ["destination", initial.destination.slug],
    queryFn: () => fetchDestinationPage(initial.destination.slug),
    initialData: initial,
  });
  return <DestinationView {...data} onAdd={useAddToCart()} />;
}
