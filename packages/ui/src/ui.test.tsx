import { render, screen } from "@testing-library/react";
import { StatusBadge, formatPHP, statusTone } from "./index";

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
