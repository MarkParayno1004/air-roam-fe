import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { CountryMultiSelect } from "../../components/CountryMultiSelect";
import { ThumbnailUpload, validateThumbnail } from "./ThumbnailUpload";
import { VariantForm, countriesLabel, toPayload } from "./VariantForm";
import { VariantTable } from "./VariantTable";

const ASIA8 = ["HK", "JP", "KR", "MY", "SG", "TH", "TW", "VN"];
const variant = (over = {}) => ({
  id: "v1", name: "Japan 10GB · 7 days", countries: ["JP"], scope: "single", region: "asia", tag: null, is_featured: false,
  data_mb: 10240, validity_days: 7, price: "799.00", pricing_unit: "per_plan", is_active: true, created_at: "", updated_at: "", ...over,
});

test("countries column label", () => {
  expect(countriesLabel(["JP"])).toBe("Japan");
  expect(countriesLabel(ASIA8)).toBe("8 countries");
});

test("variant table shows the full country list on hover and asks before deleting", async () => {
  const onDelete = vi.fn();
  render(<VariantTable variants={[variant({ countries: ASIA8, name: "Asia 8" })] as never} productType="esim" onEdit={vi.fn()} onDelete={onDelete} />);
  expect(screen.getByText("8 countries")).toHaveAttribute("title", expect.stringContaining("Japan"));
  await userEvent.click(screen.getByRole("button", { name: "Delete Asia 8" }));
  expect(onDelete).not.toHaveBeenCalled();
  const dialog = screen.getByRole("alertdialog");
  await userEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
  expect(onDelete).toHaveBeenCalledWith("v1");
});

function Picker() {
  const [value, setValue] = useState<string[]>(["JP"]);
  return <CountryMultiSelect value={value} onChange={setValue} />;
}

test("country multi-select search and chips", async () => {
  render(<Picker />);
  await userEvent.type(screen.getByLabelText("Add a country"), "kor");
  await userEvent.click(screen.getByRole("option", { name: /South Korea/ }));
  const chips = screen.getByRole("list", { name: "Selected countries" });
  expect(within(chips).getByText(/South Korea/)).toBeInTheDocument();
  await userEvent.click(within(chips).getByRole("button", { name: "Remove Japan" }));
  expect(within(chips).queryByText(/Japan/)).not.toBeInTheDocument();
});

test("thumbnail over 2 MB or not an image is rejected client-side", () => {
  expect(validateThumbnail(new File([new Uint8Array(2 * 1024 * 1024 + 1)], "big.png", { type: "image/png" }))).toBe("Image must be 2 MB or smaller.");
  expect(validateThumbnail(new File(["x"], "a.pdf", { type: "application/pdf" }))).toBe("Upload a PNG, JPEG, WEBP or GIF image.");
  expect(validateThumbnail(new File(["x"], "a.png", { type: "image/png" }))).toBeNull();
});

test("thumbnail upload shows the error and does not upload", async () => {
  const onUpload = vi.fn();
  render(<ThumbnailUpload current={null} onUpload={onUpload} />);
  await userEvent.upload(screen.getByLabelText("Thumbnail image"), new File([new Uint8Array(2 * 1024 * 1024 + 1)], "big.png", { type: "image/png" }));
  expect(screen.getByText("Image must be 2 MB or smaller.")).toBeInTheDocument();
  expect(onUpload).not.toHaveBeenCalled();
});

test("variant payload converts GB and keeps the countries array", () => {
  expect(toPayload({ name: "Asia 2", countries: ["JP", "KR"], region: "asia", tag: "", is_featured: false, data_gb: "10", validity_days: "15", price: "1299", pricing_unit: "per_plan", is_active: true })).toEqual({
    name: "Asia 2", countries: ["JP", "KR"], region: "asia", tag: null, is_featured: false, data_mb: 10240, validity_days: 15, price: "1299", pricing_unit: "per_plan", is_active: true,
  });
  expect(toPayload({ name: "WiFi", countries: ["JP"], region: "asia", tag: "Popular", is_featured: true, data_gb: "", validity_days: "", price: "350", pricing_unit: "per_day", is_active: true }).data_mb).toBeNull();
});

test("variant form saves and shows backend errors", async () => {
  const onSave = vi.fn().mockRejectedValue({ fields: { countries: "Unknown country code(s): XX" } });
  render(<VariantForm initial={variant() as never} productType="esim" onSave={onSave} onCancel={vi.fn()} />);
  await userEvent.click(screen.getByRole("button", { name: "Save plan" }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ countries: ["JP"], price: "799.00" }));
  expect(await screen.findByText("Unknown country code(s): XX")).toBeInTheDocument();
});
