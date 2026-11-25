import { allOf, howYouGetIt, planTypes } from "./sold";

export function HowItWorks({ types }: { types: string[] }) {
  const plansAs = planTypes(types);
  const steps = [
    ["Choose your country", "See its plans, all priced in PHP. Add one to your cart."],
    ["Pay securely", "Log in or create an account, then pay with GCash, Maya, QR Ph or card."],
    ["Get connected", `${howYouGetIt(types)} ${plansAs.length > 0 ? `${allOf(plansAs)} days start on activation.` : ""}`],
  ];
  return (
    <section aria-labelledby="how" className="bg-primary-soft">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-14 md:px-10 md:py-20">
        <h2 id="how" className="text-2xl font-bold tracking-tight md:text-3xl">How it works</h2>
        <ol className="grid gap-8 md:grid-cols-3 md:gap-10">
          {steps.map(([title, text], i) => (
            <li key={title} className="flex gap-4 md:flex-col md:gap-5">
              <span aria-hidden className="flex items-center gap-4 self-start md:w-full">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-on-accent">{i + 1}</span>
                {i < steps.length - 1 && <span className="hidden h-0 flex-1 border-t-2 border-dashed border-accent md:block" />}
              </span>
              <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-1.5 max-w-sm leading-relaxed text-ink">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
