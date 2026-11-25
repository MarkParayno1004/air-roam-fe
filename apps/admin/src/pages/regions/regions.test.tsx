import { ApiError } from "@air-roam/api";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeClient, page, renderAdmin, staff } from "../../test-utils";
import { toPlanPayload } from "./PlanForm";
import { countriesLabel } from "./RegionsList";

const plan = { id: "p1", label: "5GB · 7 days", for_wifi: false, name: "", data_mb: 5120, validity_days: 7, price: "399.00", is_active: true, created_at: "", updated_at: "" };
const wifiPlan = { ...plan, id: "w1", label: "Regular · 1GB/day", for_wifi: true, name: "Regular", data_mb: 1024, validity_days: null, price: "100.00" };
const region = { id: "r1", name: "Asia 1", countries: ["JP", "KR"], is_active: true, created_at: "", updated_at: "", plans: [plan, wifiPlan] };
type Opts = { method?: string; json?: unknown } | undefined;

/** Reads return the region; writes go to `write`. */
const regionClient = (write: (path: string, opts: Opts) => unknown) =>
  fakeClient(staff(["marketing"]), (p, o) => ((o as Opts)?.method ? write(p, o as Opts) : p.startsWith("staff/regions?") ? page([region]) : Promise.resolve(region)));

test("plan payload converts GB; empty means unlimited", () => {
  expect(toPlanPayload({ data_gb: "5", validity_days: "7", price: " 399 ", is_active: true })).toEqual({ data_mb: 5120, validity_days: 7, price: "399", is_active: true });
  expect(toPlanPayload({ data_gb: "", validity_days: "30", price: "999", is_active: true }).data_mb).toBeNull();
  expect(toPlanPayload({ name: " Regular ", data_gb: "1", validity_days: "", price: "100", is_active: true }, true)).toEqual({ name: "Regular", data_mb: 1024, price: "100", is_active: true, for_wifi: true });
});

test("countries column label", () => {
  expect(countriesLabel(["JP"])).toBe("Japan");
  expect(countriesLabel(["JP", "KR"])).toBe("2 countries");
});

test("marketing sees regions with their countries, WiFi price and SIM plan count", async () => {
  renderAdmin("/", regionClient(vi.fn()));
  await userEvent.click(await screen.findByRole("link", { name: "Regions & prices" }));
  const row = (await screen.findByRole("link", { name: "Asia 1" })).closest("tr")!;
  expect(within(row).getByText("2 countries")).toHaveAttribute("title", "Japan, South Korea");
  expect(row).toHaveTextContent("from ₱100/day");
  expect(within(row).getAllByRole("cell")[3]).toHaveTextContent(/^1$/); // the WiFi plan is not counted
});

test("creating a region sends countries; no WiFi rate is sent", async () => {
  const write = vi.fn().mockResolvedValue(region);
  renderAdmin("/regions/new", regionClient(write));
  await userEvent.type(await screen.findByLabelText("Region name"), "Asia 1");
  await userEvent.type(screen.getByLabelText("Add a country"), "japan{Enter}");
  await userEvent.click(screen.getByRole("button", { name: "Create region" }));
  expect(write).toHaveBeenCalledWith("staff/regions", { method: "POST", json: { name: "Asia 1", countries: ["JP"], is_active: true } });
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

test("unsaved region edits survive a plan change", async () => {
  // a fresh object per read, like the real API: plan writes don't bump the region's updated_at
  const client = fakeClient(staff(["marketing"]), () => Promise.resolve(region));
  renderAdmin("/regions/r1", client);
  const name = await screen.findByDisplayValue("Asia 1");
  await userEvent.type(name, "x");
  (client.request as ReturnType<typeof vi.fn>).mockImplementation((p: string, o?: Opts) => Promise.resolve(p === "me" ? staff(["marketing"]) : o?.method ? undefined : { ...region, plans: [wifiPlan] }));
  await userEvent.click(screen.getByRole("button", { name: "Delete 5GB · 7 days" }));
  await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }));
  expect(await screen.findByText("No plans yet. Add the first one.")).toBeInTheDocument();
  expect(screen.getByLabelText("Region name")).toHaveValue("Asia 1x");
});

test("editing after a save clears the Saved message", async () => {
  renderAdmin("/regions/r1", regionClient(() => Promise.resolve(region)));
  await screen.findByDisplayValue("Asia 1");
  await userEvent.click(screen.getByRole("button", { name: "Save region" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Saved.");
  await userEvent.type(screen.getByLabelText("Region name"), "x");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

const addWifi = async (write: Parameters<typeof regionClient>[0]) => {
  renderAdmin("/regions/r1", regionClient(write));
  await userEvent.click(await screen.findByRole("button", { name: "Add Pocket WiFi plan" }));
};
const wifiClient = (over: Partial<typeof wifiPlan>, write: (path: string, opts: Opts) => unknown) =>
  fakeClient(staff(["marketing"]), (p, o) => ((o as Opts)?.method ? write(p, o as Opts) : Promise.resolve({ ...region, plans: [{ ...wifiPlan, ...over }] })));
const choose = (name: string) => userEvent.selectOptions(screen.getByLabelText("Plan"), name);
const save = () => userEvent.click(screen.getByRole("button", { name: "Save plan" }));

test("a new Pocket WiFi plan starts as Unlimited, with no GB field", async () => {
  const write = vi.fn().mockResolvedValue(undefined);
  await addWifi(write);
  expect(screen.getByRole("button", { name: "Add plan" })).toBeInTheDocument(); // the other card stays
  expect(within(screen.getByLabelText("Plan")).getAllByRole("option").map((o) => o.textContent)).toEqual(["Unlimited", "Regular"]);
  expect(screen.queryByLabelText("GB per day")).not.toBeInTheDocument();
  expect(screen.getByText("Unlimited", { selector: "span" })).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText("Price per day (PHP)"), "350");
  await save();
  expect(write).toHaveBeenCalledWith("staff/regions/r1/plans", { method: "POST", json: { name: "Unlimited", data_mb: null, price: "350", is_active: true, for_wifi: true } });
});

test("Regular shows 1 GB; going back to Unlimited drops it", async () => {
  const write = vi.fn().mockResolvedValue(undefined);
  await addWifi(write);
  await choose("Regular");
  expect(screen.getByLabelText("GB per day")).toHaveValue("1");
  await userEvent.type(screen.getByLabelText("Price per day (PHP)"), "120");
  await save();
  expect(write).toHaveBeenLastCalledWith("staff/regions/r1/plans", { method: "POST", json: { name: "Regular", data_mb: 1024, price: "120", is_active: true, for_wifi: true } });

  await userEvent.click(await screen.findByRole("button", { name: /^Edit Regular/ }));
  await choose("Unlimited");
  await save();
  expect(write).toHaveBeenLastCalledWith("staff/regions/r1/plans/w1", expect.objectContaining({ json: expect.objectContaining({ name: "Unlimited", data_mb: null }) }));
});

test.each([["abc", /Enter a number of GB/], ["", /Enter the GB per day/]])("Regular with GB %j is rejected instead of becoming unlimited", async (gb, message) => {
  const write = vi.fn();
  await addWifi(write);
  await choose("Regular");
  await userEvent.clear(screen.getByLabelText("GB per day"));
  if (gb) await userEvent.type(screen.getByLabelText("GB per day"), gb);
  await save();
  expect(await screen.findByText(message)).toBeInTheDocument();
  expect(write).not.toHaveBeenCalled();
});

test("a duplicate plan error shows under Plan", async () => {
  await addWifi(vi.fn().mockRejectedValue(new ApiError(400, { name: ["This region already has a Pocket WiFi plan with this name."] })));
  await save();
  expect(await screen.findByText(/already has a Pocket WiFi plan/)).toBeInTheDocument();
  expect(screen.getByLabelText("Plan")).toBeInvalid();
  expect(screen.getByLabelText("Plan")).toHaveAccessibleDescription(/already has a Pocket WiFi plan/);
});

test.each([
  ["Regular", 2, ["Unlimited", "Regular"], "2"],
  ["Plus", 3, ["Regular", "Plus"], "3"],
  ["Plus", 3, ["Unlimited", "Plus"], "3"],
  ["Plus", 3, ["Regular"], "1"],
  ["Unlimited", 2, ["Regular", "Unlimited"], "2"],
])("%s %iGB switched to %j has %s GB", async (name, gb, picks, shown) => {
  renderAdmin("/regions/r1", wifiClient({ name, label: name, data_mb: gb * 1024 }, vi.fn()));
  await userEvent.click(await screen.findByRole("button", { name: `Edit ${name}` }));
  for (const pick of picks) await choose(pick);
  expect(screen.getByLabelText("GB per day")).toHaveValue(shown);
});

test("a price edit on a capped plan named Unlimited keeps its cap", async () => {
  const write = vi.fn().mockResolvedValue(undefined);
  renderAdmin("/regions/r1", wifiClient({ name: "Unlimited", label: "Unlimited", data_mb: 2048 }, write));
  await userEvent.click(await screen.findByRole("button", { name: "Edit Unlimited" }));
  expect(screen.getByLabelText("GB per day")).toHaveValue("2");
  await userEvent.clear(screen.getByLabelText("Price per day (PHP)"));
  await userEvent.type(screen.getByLabelText("Price per day (PHP)"), "400");
  await save();
  expect(write).toHaveBeenCalledWith("staff/regions/r1/plans/w1", expect.objectContaining({ json: expect.objectContaining({ name: "Unlimited", data_mb: 2048, price: "400" }) }));
});

test("a plan saved under another name keeps it and its GB", async () => {
  const write = vi.fn().mockResolvedValue(undefined);
  renderAdmin("/regions/r1", wifiClient({ name: "Plus", label: "Plus · 2GB/day", data_mb: 2048 }, write));
  await userEvent.click(await screen.findByRole("button", { name: /^Edit Plus/ }));
  expect(screen.getByLabelText("Plan")).toHaveValue("Plus");
  await save();
  expect(write).toHaveBeenCalledWith("staff/regions/r1/plans/w1", expect.objectContaining({ json: expect.objectContaining({ name: "Plus", data_mb: 2048 }) }));
});
