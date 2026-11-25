import { ApiError } from "@air-roam/api";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeClient, page, renderAdmin, staff } from "../../test-utils";
import { toPlanPayload } from "./PlanForm";
import { countriesLabel } from "./RegionsList";

const plan = { id: "p1", label: "5GB · 7 days", data_mb: 5120, validity_days: 7, price: "399.00", is_active: true, created_at: "", updated_at: "" };
const region = { id: "r1", name: "Asia 1", countries: ["JP", "KR"], pocket_wifi_daily_rate: "100.00", is_active: true, created_at: "", updated_at: "", plans: [plan] };
type Opts = { method?: string; json?: unknown } | undefined;

/** Reads return the region; writes go to `write`. */
const regionClient = (write: (path: string, opts: Opts) => unknown) =>
  fakeClient(staff(["marketing"]), (p, o) => ((o as Opts)?.method ? write(p, o as Opts) : p.startsWith("staff/regions?") ? page([region]) : Promise.resolve(region)));

test("plan payload converts GB; empty means unlimited", () => {
  expect(toPlanPayload({ data_gb: "5", validity_days: "7", price: " 399 ", is_active: true })).toEqual({ data_mb: 5120, validity_days: 7, price: "399", is_active: true });
  expect(toPlanPayload({ data_gb: "", validity_days: "30", price: "999", is_active: true }).data_mb).toBeNull();
});

test("countries column label", () => {
  expect(countriesLabel(["JP"])).toBe("Japan");
  expect(countriesLabel(["JP", "KR"])).toBe("2 countries");
});

test("marketing sees regions with their countries, rate and plan count", async () => {
  renderAdmin("/", regionClient(vi.fn()));
  await userEvent.click(await screen.findByRole("link", { name: "Regions & prices" }));
  const row = (await screen.findByRole("link", { name: "Asia 1" })).closest("tr")!;
  expect(within(row).getByText("2 countries")).toHaveAttribute("title", "Japan, South Korea");
  expect(row).toHaveTextContent("₱100");
});

test("creating a region sends countries; a blank WiFi rate is null", async () => {
  const write = vi.fn().mockResolvedValue(region);
  renderAdmin("/regions/new", regionClient(write));
  await userEvent.type(await screen.findByLabelText("Region name"), "Asia 1");
  await userEvent.type(screen.getByLabelText("Add a country"), "japan{Enter}");
  await userEvent.click(screen.getByRole("button", { name: "Create region" }));
  expect(write).toHaveBeenCalledWith("staff/regions", { method: "POST", json: { name: "Asia 1", countries: ["JP"], pocket_wifi_daily_rate: null, is_active: true } });
  expect(await screen.findByText("5GB · 7 days")).toBeInTheDocument(); // moved on to the plans
});

test("a country clash from the server shows under countries", async () => {
  renderAdmin("/regions/r1", regionClient(() => Promise.reject(new ApiError(400, { countries: ["Japan is already in region Asia 2."] }))));
  await screen.findByDisplayValue("Asia 1");
  await userEvent.click(screen.getByRole("button", { name: "Save region" }));
  expect(await screen.findByText("Japan is already in region Asia 2.")).toBeInTheDocument();
});

test("adding a plan posts to the region and shows server errors", async () => {
  const write = vi.fn().mockRejectedValue(new ApiError(400, { price: ["Ensure this value is greater than or equal to 0.01."] }));
  renderAdmin("/regions/r1", regionClient(write));
  await userEvent.click(await screen.findByRole("button", { name: "Add plan" }));
  await userEvent.type(screen.getByLabelText("Data (GB)"), "10");
  await userEvent.type(screen.getByLabelText("Validity (days)"), "14");
  await userEvent.type(screen.getByLabelText("Price (PHP)"), "0");
  await userEvent.click(screen.getByRole("button", { name: "Save plan" }));
  expect(write).toHaveBeenCalledWith("staff/regions/r1/plans", { method: "POST", json: { data_mb: 10240, validity_days: 14, price: "0", is_active: true } });
  expect(await screen.findByText(/greater than or equal to 0.01/)).toBeInTheDocument();
});

test("a plan is deleted only after confirming", async () => {
  const write = vi.fn().mockResolvedValue(undefined);
  renderAdmin("/regions/r1", regionClient(write));
  await userEvent.click(await screen.findByRole("button", { name: "Delete 5GB · 7 days" }));
  expect(write).not.toHaveBeenCalled();
  await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }));
  expect(write).toHaveBeenCalledWith("staff/regions/r1/plans/p1", { method: "DELETE" });
});
