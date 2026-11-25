import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { createRoutesStub } from "react-router";
import type { Destination, Product } from "@air-roam/api";
import MultiCountry from "../routes/multi-country";
import Products from "../routes/products";
import { CountryCombobox } from "./CountryCombobox";
import { PlanPicker } from "./PlanPicker";

const onAdd = vi.fn();
vi.mock("./useAddToCart", () => ({ useAddToCart: () => onAdd }));
beforeEach(() => onAdd.mockClear());

const plan = (id: string, gb: number, days: number, price: string) => ({ id, label: `${gb}GB · ${days} days`, data_mb: gb * 1024, validity_days: days, price });
const asiaPlans = [plan("a5", 5, 7, "399.00"), plan("a10", 10, 14, "699.00")];
const regular = { id: "w1", name: "Regular", label: "Regular · 1GB/day", data_mb: 1024, price: "200.00" };
const unlimited = { id: "w0", name: "Unlimited", label: "Unlimited", data_mb: null, price: "350.00" };
const asia = { id: "r-asia", name: "Asia" };
const country = (code: string, name: string, over: Partial<Destination>): Destination => ({
  region: asia, country_code: code, country_name: name, slug: name.toLowerCase(), from_price: "100.00", wifi_plans: [regular, unlimited], is_popular: false, plans: asiaPlans, ...over,
});
const france = country("FR", "France", { region: { id: "r-eu", name: "Europe" }, wifi_plans: [], plans: [plan("e5", 5, 7, "499.00"), plan("e20", 20, 30, "900.00")] });
const japan = country("JP", "Japan", {});
const korea = country("KR", "South Korea", {});
const usa = country("US", "United States", { region: { id: "r-us", name: "Americas" }, wifi_plans: [unlimited], plans: [] });
const all = [france, japan, korea, usa];

const esim: Product = { id: "pe", product_name: "Air Roam eSIM", product_type: "esim", product_thumbnail_img: null, product_description: "" };
const sim: Product = { ...esim, id: "ps", product_name: "Air Roam SIM", product_type: "sim" };
const wifi: Product = { ...esim, id: "pw", product_name: "Air Roam Pocket WiFi", product_type: "pocket_wifi" };
const esimLine = { id: "pe", product_name: "Air Roam eSIM", product_type: "esim" };

async function page(path: string, destinations = all, products = [esim, sim, wifi]) {
  const Stub = createRoutesStub([
    { path: "/products", Component: Products, loader: () => ({ destinations, products }), HydrateFallback: () => null },
    { path: "/products/multi-country", Component: MultiCountry, loader: () => ({ destinations, products }), HydrateFallback: () => null },
  ]);
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  render(<QueryClientProvider client={client}><Stub initialEntries={[path]} /></QueryClientProvider>);
  await screen.findByRole("heading", { level: 1 });
  await act(async () => {}); // mounted: controls are enabled
}
const single = (...args: [Destination[]?, Product[]?]) => page("/products", ...args);
const multi = (...args: [Destination[]?, Product[]?]) => page("/products/multi-country", ...args);

const field = () => screen.getByRole("combobox", { name: "Destination country" });
const options = () => screen.getAllByRole("option").map((o) => o.textContent);
const radio = (name: string) => screen.getByRole("radio", { name });
const ticket = () => screen.getByRole("complementary", { name: "Your trip" });
const select = (name: string) => screen.getByRole("combobox", { name });
const optionsOf = (name: string) => within(select(name)).getAllByRole("option").map((o) => o.textContent);
async function pick(name: string) {
  await userEvent.clear(field());
  await userEvent.type(field(), `${name}{Enter}`);
}

describe("country combobox", () => {
  const onChange = vi.fn();
  beforeEach(() => {
    onChange.mockClear();
    const view = render(<CountryCombobox destinations={all} value="" onChange={pickCode} />);
    function pickCode(code: string) {
      onChange(code);
      view.rerender(<CountryCombobox destinations={all} value={code} onChange={pickCode} />);
    }
  });

  test("empty shows every country, closed until focused", async () => {
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await userEvent.click(field());
    expect(field()).toHaveAttribute("aria-expanded", "true");
    expect(options()).toEqual(["France", "Japan", "South Korea", "United States"]);
  });

  test("typing filters by name, or by exact code", async () => {
    await userEvent.type(field(), "AN");
    expect(options()).toEqual(["France", "Japan"]);
    await userEvent.clear(field());
    await userEvent.type(field(), "kr");
    expect(options()).toEqual(["South Korea"]);
  });

  test("Enter picks the highlighted country; the list then shows every country again", async () => {
    await userEvent.type(field(), "an{ArrowDown}");
    expect(field()).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "Japan" }).id);
    await userEvent.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("JP");
    expect(field()).toHaveValue("Japan");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await userEvent.click(field());
    expect(options()).toHaveLength(4);
    expect(screen.getByRole("option", { name: "Japan" })).toHaveAttribute("aria-selected", "true");
  });

  test("arrows open the list and wrap; Escape closes it", async () => {
    await userEvent.click(field());
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await userEvent.keyboard("{ArrowUp}{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("US");
  });

  test("the mouse picks", async () => {
    await userEvent.click(field());
    await userEvent.click(screen.getByRole("option", { name: "France" }));
    expect(onChange).toHaveBeenLastCalledWith("FR");
    expect(field()).toHaveValue("France");
  });

  test("no match says so and Enter picks nothing", async () => {
    await userEvent.type(field(), "zzz{Enter}");
    expect(screen.getByText("No country found")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  test("leaving restores the chosen name, or clears the choice when empty", async () => {
    await userEvent.type(field(), "zzz");
    await userEvent.tab();
    expect(field()).toHaveValue("");
    await pick("Japan");
    await userEvent.type(field(), "x");
    await userEvent.tab();
    expect(field()).toHaveValue("Japan");
    await userEvent.clear(field());
    await userEvent.type(field(), "france");
    await userEvent.tab();
    expect(field()).toHaveValue("France");
    expect(onChange).toHaveBeenLastCalledWith("FR");
    await pick("Japan");
    expect(onChange).toHaveBeenLastCalledWith("JP");
    await userEvent.clear(field());
    await userEvent.tab();
    expect(onChange).toHaveBeenLastCalledWith("");
    expect(field()).toHaveValue("");
  });
});

test("controls are disabled until mounted", () => {
  document.body.innerHTML = renderToString(
    <>
      <CountryCombobox destinations={[...all, { ...japan, country_code: "TH", is_popular: true }]} value="" onChange={vi.fn()} />
      <PlanPicker products={[wifi, esim]} destination={japan} onAdd={onAdd} />
    </>,
  );
  const controls = document.querySelectorAll("input, select, button");
  expect(controls.length).toBeGreaterThan(5);
  for (const c of controls) expect(c).toBeDisabled();
  document.body.innerHTML = "";
});

describe("one country", () => {
  test("before a country is chosen: products explained, nothing to price or buy", async () => {
    await single();
    expect(screen.getByRole("heading", { level: 1, name: "Where are you going?" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "One country" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Multiple countries" })).not.toHaveAttribute("aria-current");
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Air Roam Pocket WiFi", "Air Roam eSIM", "Air Roam SIM"]);
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument(); // no popular countries, no chips
    expect(screen.queryByText(/₱|—/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Visiting more than one country/ })).toHaveAttribute("href", "/products/multi-country");
    expect(screen.queryByText(/Asia|Europe/)).not.toBeInTheDocument();
  });

  test("popular countries are one tap away", async () => {
    await single([france, { ...japan, is_popular: true }]);
    const chips = screen.getByRole("group", { name: "Popular countries" });
    expect(within(chips).getAllByRole("button").map((b) => b.textContent)).toEqual(["Japan"]);
    await userEvent.click(within(chips).getByRole("button", { name: "Japan" }));
    expect(field()).toHaveValue("Japan");
    expect(within(chips).getByRole("button", { name: "Japan" })).toHaveAttribute("aria-pressed", "true");
    expect(ticket()).toHaveTextContent("JPJapan");
  });

  test("eSIM: the chosen plan is priced and added for the country", async () => {
    await single();
    await pick("Japan");
    expect(radio("Air Roam eSIM")).toHaveAccessibleDescription(/Data only.*from ₱399/);
    await userEvent.click(radio("Air Roam eSIM"));
    expect(radio("5GB · 7 days")).toBeChecked();
    expect(radio("5GB · 7 days")).toHaveAccessibleDescription("₱399 ₱57/day");
    await userEvent.click(radio("10GB · 14 days"));
    expect(ticket()).toHaveTextContent(/Air Roam eSIM.*10GB · 14 days.*When you activate.*Total ₱699/);
    await userEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(onAdd).toHaveBeenCalledWith({ product: esimLine, country_code: "JP", plan: asiaPlans[1] });
  });

  test("a plan without a data limit says Unlimited", async () => {
    await single([{ ...japan, plans: [{ ...asiaPlans[0], label: "Unlimited · 7 days", data_mb: null }] }], [esim]);
    await pick("Japan");
    expect(radio("Unlimited · 7 days").closest("label")).toHaveTextContent("Unlimited7 days₱399 ₱57/day");
  });

  test("WiFi: a plan is chosen, priced per day, and rented with its dates", async () => {
    await single();
    await pick("Japan");
    expect(radio("Air Roam Pocket WiFi")).toBeChecked();
    expect(radio("Air Roam Pocket WiFi")).toHaveAccessibleDescription(/from ₱200\/day/);
    expect(radio("Unlimited").closest("label")).toHaveTextContent("UnlimitedUnlimited data₱350/day");
    await userEvent.click(radio("Unlimited"));
    expect(ticket()).toHaveTextContent("Price per day ₱350");
    await userEvent.click(radio("Regular · 1GB/day"));
    const rent = screen.getByRole("button", { name: "Rent device" });
    expect(rent).toBeDisabled();
    expect(rent).toHaveAccessibleDescription("Choose your rental dates to continue.");
    expect(ticket()).toHaveTextContent("₱200 delivery for 7 days or fewer, free above.");
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2099-12-12" } });
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2099-12-12" } });
    expect(rent).toBeDisabled();
    expect(rent).toHaveAccessibleDescription("The end date must be after the start date.");
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2099-12-14" } });
    expect(ticket()).toHaveTextContent(/Regular · 1GB\/day.*Dec 12, 2099 – Dec 14, 2099.*₱200 × 2 days₱400.*Total before delivery ₱400/);
    expect(rent).not.toHaveAccessibleDescription();
    await userEvent.click(rent);
    expect(onAdd).toHaveBeenCalledWith({
      product: { id: "pw", product_name: "Air Roam Pocket WiFi", product_type: "pocket_wifi" },
      country_code: "JP", plan: regular, start_date: "2099-12-12", end_date: "2099-12-14",
    });
  });

  test("dates are only asked for Pocket WiFi", async () => {
    await single();
    await pick("Japan");
    expect(screen.getByLabelText("Start date")).toBeInTheDocument();
    await userEvent.click(radio("Air Roam SIM"));
    expect(screen.queryByLabelText("Start date")).not.toBeInTheDocument();
    expect(ticket()).not.toHaveTextContent("delivery");
  });

  test("a product with nothing to sell there is disabled and the first available one is selected", async () => {
    await single();
    await pick("Japan");
    await userEvent.click(radio("Air Roam eSIM"));
    await userEvent.click(radio("Air Roam Pocket WiFi")); // chosen by hand, not just preselected
    await pick("France");
    expect(radio("Air Roam Pocket WiFi")).toBeDisabled();
    expect(radio("Air Roam Pocket WiFi")).not.toBeChecked();
    expect(radio("Air Roam Pocket WiFi")).toHaveAccessibleDescription(/Not available in France/);
    expect(radio("Air Roam eSIM")).toBeChecked();
    expect(screen.getByRole("button", { name: "Add to cart" })).toBeEnabled();
    await pick("United States");
    expect(radio("Air Roam eSIM")).toBeDisabled();
    expect(radio("Air Roam Pocket WiFi")).toBeChecked();
  });

  test("nothing available there says so", async () => {
    await single(all, [wifi]);
    await pick("France");
    expect(screen.getByRole("button", { name: "Add to cart" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add to cart" })).toHaveAccessibleDescription("Nothing available in France right now.");
  });

  test("changing country resets the plan, even to a country with the same plans", async () => {
    await single();
    await pick("Japan");
    await userEvent.click(radio("Unlimited"));
    await userEvent.click(radio("Air Roam eSIM"));
    await userEvent.click(radio("10GB · 14 days"));
    await pick("South Korea");
    expect(radio("Air Roam eSIM")).toBeChecked();
    expect(radio("5GB · 7 days")).toBeChecked();
    await userEvent.click(radio("Air Roam Pocket WiFi"));
    expect(radio("Regular · 1GB/day")).toBeChecked();
    await userEvent.click(radio("Air Roam eSIM"));
    await userEvent.click(radio("10GB · 14 days"));
    await pick("France");
    expect(radio("5GB · 7 days")).toBeChecked();
    await userEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(onAdd).toHaveBeenCalledWith({ product: esimLine, country_code: "FR", plan: france.plans[0] });
    await pick("South Korea");
    expect(radio("5GB · 7 days")).toBeChecked();
  });

  test("no products", async () => {
    await single(all, []);
    expect(screen.getByText("No products available right now.")).toBeInTheDocument();
  });
});

describe("multiple countries", () => {
  const REGION = "Region";
  const productIds = () => screen.getAllByRole("radio", { name: /^Air Roam/ }).map((x) => x.getAttribute("value"));
  const covers = (heading: string) => within(screen.getByRole("region", { name: heading })).getAllByRole("listitem").map((c) => c.textContent);

  test("eSIM and SIM only; regions with plans, sorted, first preselected; covers its countries", async () => {
    await multi();
    expect(screen.getByRole("link", { name: "Multiple countries" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "One country" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: /Visiting only one country/ })).toHaveAttribute("href", "/products");
    expect(productIds()).toEqual(["pe", "ps"]);
    expect(optionsOf(REGION)).toEqual(["Asia", "Europe"]); // Americas has WiFi plans but no SIM/eSIM plans
    expect(select(REGION)).toHaveValue("r-asia");
    expect(covers("One plan works in 2 countries")).toEqual(["Japan", "South Korea"]);
    expect(ticket()).toHaveTextContent(/Asia.*5GB · 7 days.*Total ₱399/);
  });

  test("two regions with one name stay two options", async () => {
    await multi([japan, { ...france, region: { id: "r-asia-2", name: "Asia" } }]);
    expect(optionsOf(REGION)).toEqual(["Asia", "Asia"]);
    await userEvent.selectOptions(select(REGION), "r-asia-2");
    expect(covers("One plan works in 1 country")).toEqual(["France"]);
  });

  test("adds the whole region, with no country", async () => {
    await multi();
    await userEvent.click(radio("10GB · 14 days"));
    await userEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(onAdd).toHaveBeenCalledWith({ product: esimLine, country_code: "", region: asia, plan: asiaPlans[1] });
  });

  test("changing region resets the plan and keeps the chosen product", async () => {
    await multi();
    await userEvent.click(radio("Air Roam SIM"));
    await userEvent.click(radio("10GB · 14 days"));
    await userEvent.selectOptions(select(REGION), "Europe");
    expect(radio("Air Roam SIM")).toBeChecked();
    expect(radio("5GB · 7 days")).toBeChecked();
    await userEvent.selectOptions(select(REGION), "Asia");
    expect(radio("5GB · 7 days")).toBeChecked();
  });

  test("no regions with plans", async () => {
    await multi([usa]);
    expect(screen.getByText("No multi-country plans available right now.")).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });
});

test.each([
  [esim, "10GB · 14 days", "Add to cart", { plans: [asiaPlans[0]] }],
  [wifi, "Unlimited", "Rent device", { wifi_plans: [regular] }],
])("a picked plan that is withdrawn can't be bought and isn't swapped for another %#", async (product, name, cta, left) => {
  const picker = (d: Destination) => <PlanPicker products={[product]} destination={d} onAdd={onAdd} />;
  const { rerender } = render(picker(japan));
  await userEvent.click(radio(name));
  rerender(picker({ ...japan, ...left }));
  for (const tile of screen.getAllByRole("radio").slice(1)) expect(tile).not.toBeChecked();
  expect(screen.getByRole("button", { name: cta })).toBeDisabled();
  expect(screen.getByRole("button", { name: cta })).toHaveAccessibleDescription("That plan is no longer available. Choose another.");
  expect(ticket()).not.toHaveTextContent(/₱399|Regular/);
});
