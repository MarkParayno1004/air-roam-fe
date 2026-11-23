import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PackCard, PlanCard, StatusBadge, formatPHP, statusTone, type CatalogVariant } from "./index";

const japan: CatalogVariant = {
  id: "v1", name: "Japan 10GB · 7 days", countries: ["JP"], scope: "single", region: "asia", tag: "Best value",
  is_featured: true, data_mb: 10240, validity_days: 7, price: "799.00", pricing_unit: "per_plan", product_type: "esim",
};

test("formatPHP", () => {
  expect(formatPHP(1299)).toBe("₱1,299");
  expect(formatPHP("749.50")).toBe("₱749.50");
  expect(formatPHP("2100.00")).toBe("₱2,100");
});

test.each([
  ["pending_payment", "grey"], ["pending", "grey"], ["expired", "grey"], ["refunded", "grey"],
  ["paid", "teal"], ["confirmed", "teal"], ["active", "teal"],
  ["fulfilled", "green"], ["completed", "green"], ["cancelled", "red"],
])("tone %s → %s", (s, t) => expect(statusTone(s)).toBe(t));

test("StatusBadge shows readable text", () => {
  render(<StatusBadge status="pending_payment" />);
  expect(screen.getByText("Pending payment")).toHaveAttribute("data-tone", "grey");
});

test("PlanCard per_plan", async () => {
  const onAdd = vi.fn();
  render(<PlanCard variant={japan} onAdd={onAdd} />);
  expect(screen.getByText("₱799")).toBeInTheDocument();
  expect(screen.getByText("per plan")).toBeInTheDocument();
  expect(screen.getByText("Best value")).toBeInTheDocument();
  expect(screen.getByText("10 GB data · valid 7 days")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Add to cart" }));
  expect(onAdd).toHaveBeenCalledWith(japan);
});

test("PlanCard per_day shows per day and Rent device", () => {
  render(<PlanCard variant={{ ...japan, pricing_unit: "per_day", product_type: "pocket_wifi", data_mb: null, price: "350.00", tag: null }} onAdd={() => {}} />);
  expect(screen.getByText("per day")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Rent device" })).toBeInTheDocument();
  expect(screen.getByText(/Unlimited data/)).toBeInTheDocument();
});

test("PackCard shows count and +N", () => {
  render(<PackCard variant={{ ...japan, scope: "multi", countries: ["HK", "JP", "KR", "MY", "SG", "TH", "TW", "VN"] }} onAdd={() => {}} />);
  expect(screen.getByText("8 countries")).toBeInTheDocument();
  expect(screen.getByText("+1")).toBeInTheDocument();
  expect(screen.getByText("HK")).toBeInTheDocument();
});
