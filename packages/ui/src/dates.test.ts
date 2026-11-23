import { formatDate } from "./format";

test("tests run west of Manila", () => {
  expect(new Date("2026-12-12T00:00:00+08:00").getDate()).toBe(11); // local LA date is the day before
});

test("dates are shown in Manila time for every traveler", () => {
  expect(formatDate("2026-12-12T00:00:00+08:00")).toBe("Dec 12, 2026"); // booking start (Manila midnight)
  expect(formatDate("2026-12-12")).toBe("Dec 12, 2026"); // cart/checkout date-only value
});
