import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeClient, page, renderAdmin, staff } from "../../test-utils";
import { UserForm } from "./UserForm";

test("new staff user needs at least one permission and a 10+ character password", async () => {
  const onSave = vi.fn();
  render(<UserForm onSave={onSave} onCancel={vi.fn()} />);
  await userEvent.type(screen.getByLabelText("First name"), "Mia");
  await userEvent.type(screen.getByLabelText("Last name"), "Cruz");
  await userEvent.type(screen.getByLabelText("Email"), "mia@airroam.ph");
  await userEvent.type(screen.getByLabelText("Password"), "short");
  await userEvent.click(screen.getByRole("button", { name: "Create user" }));
  expect(screen.getByText("Use at least 10 characters.")).toBeInTheDocument();
  expect(screen.getByText("Choose at least one role.")).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();

  await userEvent.clear(screen.getByLabelText("Password"));
  await userEvent.type(screen.getByLabelText("Password"), "long-enough-pass");
  await userEvent.click(screen.getByRole("checkbox", { name: /Marketing/ }));
  await userEvent.click(screen.getByRole("button", { name: "Create user" }));
  await waitFor(() => expect(onSave).toHaveBeenCalledWith({ first_name: "Mia", last_name: "Cruz", email: "mia@airroam.ph", contact_no: "", password: "long-enough-pass", permissions: ["marketing"] }));
});

test("editing keeps the password optional", async () => {
  const onSave = vi.fn();
  render(<UserForm initial={{ id: "u1", first_name: "Mia", last_name: "Cruz", email: "mia@airroam.ph", contact_no: "", permissions: ["marketing"] } as never} onSave={onSave} onCancel={vi.fn()} />);
  await userEvent.click(screen.getByRole("checkbox", { name: /Admin/ }));
  await userEvent.click(screen.getByRole("button", { name: "Save user" }));
  await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ permissions: ["admin", "marketing"] })));
  expect(onSave.mock.calls[0][0]).not.toHaveProperty("password");
});

test("admin sees the users list", async () => {
  const people = [{ id: "u1", first_name: "Mia", last_name: "Cruz", email: "mia@airroam.ph", contact_no: "", permissions: ["marketing"], created_at: "2026-11-23T00:00:00Z" }];
  renderAdmin("/users", fakeClient(staff(["admin"]), () => page(people)));
  expect(await screen.findByText("mia@airroam.ph")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "New user" })).toBeInTheDocument();
});
