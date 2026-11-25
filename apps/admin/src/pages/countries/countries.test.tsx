import { ApiError } from "@air-roam/api";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeClient, renderAdmin, staff } from "../../test-utils";

const rows = (popular: string[]) => [["FR", "France", "Europe"], ["JP", "Japan", "Asia 1"], ["KR", "South Korea", "Asia 1"]]
  .map(([code, name, region]) => ({ code, name, region, is_popular: popular.includes(code) }));
const countriesClient = (write: (o: { json: unknown }) => Promise<unknown>) =>
  fakeClient(staff(["marketing"]), (_p, o) => ((o as { method?: string })?.method ? write(o as { json: unknown }) : Promise.resolve(rows(["FR"]))));
const popular = (name: string) => screen.getByRole("checkbox", { name: `Show ${name} as popular` });
const saveButton = () => screen.getByRole("button", { name: "Save" });

test("marketing opens Countries from the sidebar and sees region and current choice", async () => {
  renderAdmin("/", countriesClient(vi.fn()));
  await userEvent.click(await screen.findByRole("link", { name: "Countries" }));
  expect((await screen.findByText("Japan")).closest("tr")).toHaveTextContent("Asia 1");
  expect(popular("France")).toBeChecked();
  expect(popular("Japan")).not.toBeChecked();
});

test("Save sends only what changed and confirms", async () => {
  const write = vi.fn().mockResolvedValue(rows(["JP"]));
  renderAdmin("/countries", countriesClient(write));
  await screen.findByText("Japan");
  expect(saveButton()).toBeDisabled();
  await userEvent.click(popular("Japan"));
  await userEvent.click(popular("France"));
  expect(screen.getByText("2 unsaved changes")).toBeInTheDocument();
  await userEvent.click(saveButton());
  expect(write).toHaveBeenCalledWith({ method: "PATCH", json: { countries: [{ code: "JP", is_popular: true }, { code: "FR", is_popular: false }] } });
  expect(await screen.findByText(/^Saved\./)).toBeInTheDocument();
  expect(popular("Japan")).toBeChecked();
  expect(saveButton()).toBeDisabled();
});

test("undoing a tick leaves nothing to save", async () => {
  renderAdmin("/countries", countriesClient(vi.fn()));
  await screen.findByText("Japan");
  await userEvent.click(popular("Japan"));
  await userEvent.click(popular("Japan"));
  expect(saveButton()).toBeDisabled();
});

test("search filters rows without losing ticks", async () => {
  renderAdmin("/countries", countriesClient(vi.fn()));
  await screen.findByText("Japan");
  await userEvent.click(popular("Japan"));
  await userEvent.type(screen.getByLabelText("Search"), "korea");
  expect(screen.queryByText("Japan")).not.toBeInTheDocument();
  expect(screen.getByText("1 unsaved change")).toBeInTheDocument();
  await userEvent.clear(screen.getByLabelText("Search"));
  expect(popular("Japan")).toBeChecked();
});

test("a failed save keeps the ticks and shows the error", async () => {
  renderAdmin("/countries", countriesClient(() => Promise.reject(new ApiError(403, {}))));
  await screen.findByText("Japan");
  await userEvent.click(popular("Japan"));
  await userEvent.click(saveButton());
  expect(await screen.findByRole("alert")).toHaveTextContent("You don't have permission to do that.");
  expect(popular("Japan")).toBeChecked();
  expect(saveButton()).toBeEnabled();
});

test("no countries yet points to regions", async () => {
  renderAdmin("/countries", fakeClient(staff(["admin"]), () => Promise.resolve([])));
  const empty = await screen.findByText(/No countries yet/);
  expect(within(empty).getByRole("link")).toHaveAttribute("href", "/regions");
});

const names = () => screen.getAllByRole("checkbox").map((c) => c.getAttribute("aria-label")!.replace(/^Show (.*) as popular$/, "$1"));

test("filters by popular and region, alone and together", async () => {
  renderAdmin("/countries", countriesClient(vi.fn()));
  await screen.findByText("Japan");
  expect(within(screen.getByLabelText("Region")).getAllByRole("option").map((o) => o.textContent)).toEqual(["All", "Asia 1", "Europe"]);
  await userEvent.selectOptions(screen.getByLabelText("Popular"), "Popular");
  expect(names()).toEqual(["France"]);
  await userEvent.selectOptions(screen.getByLabelText("Popular"), "Not popular");
  expect(names()).toEqual(["Japan", "South Korea"]);
  await userEvent.selectOptions(screen.getByLabelText("Region"), "Europe");
  expect(screen.getByText("No countries match.")).toBeInTheDocument();
  await userEvent.selectOptions(screen.getByLabelText("Popular"), "All");
  expect(names()).toEqual(["France"]);
});

test("a row stays visible while its tick is unsaved, then leaves the filter", async () => {
  renderAdmin("/countries?popular=true", countriesClient(() => Promise.resolve(rows([]))));
  await screen.findByText("France");
  await userEvent.click(popular("France"));
  expect(popular("France")).not.toBeChecked(); // still listed, so a slip can be undone
  await userEvent.click(saveButton());
  expect(await screen.findByText("No countries match.")).toBeInTheDocument();
});
