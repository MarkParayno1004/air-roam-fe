import { Link } from "react-router";

export function Logo() {
  return (
    <Link to="/" className="flex min-h-11 items-center gap-2.5" aria-label="Air Roam home">
      <img src="/favicon.svg" alt="" width={40} height={40} />
      <span className="text-lg font-bold tracking-tight whitespace-nowrap">Air Roam</span>
    </Link>
  );
}
