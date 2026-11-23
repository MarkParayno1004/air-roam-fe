import { Link } from "react-router";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Air Roam home">
      <span className="flex size-9 items-center justify-center rounded-[10px] bg-primary text-sm font-bold text-on-primary">AR</span>
      <span className="text-lg font-bold">Air Roam</span>
    </Link>
  );
}
