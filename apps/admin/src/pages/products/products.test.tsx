import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { CountryMultiSelect } from "../../components/CountryMultiSelect";
import { ThumbnailUpload, validateThumbnail } from "./ThumbnailUpload";
import { fakeClient, renderAdmin, staff } from "../../test-utils";

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

test("product editor has no plan form and links to regions", async () => {
  const product = { id: "p1", product_name: "Air Roam eSIM", product_type: "esim", product_description: "", is_active: true };
  renderAdmin("/products/p1", fakeClient(staff(["marketing"]), () => Promise.resolve(product)));
  await screen.findByDisplayValue("Air Roam eSIM");
  expect(screen.queryByRole("button", { name: "Add plan" })).not.toBeInTheDocument();
  expect(within(screen.getByRole("main")).getByRole("link", { name: "Regions & prices" })).toHaveAttribute("href", "/regions");
});
