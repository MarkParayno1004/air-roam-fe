import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Legal, { meta } from "./legal";

test.each(["/terms", "/terms/"])("%s shows the terms", (pathname) => { // some static hosts add the slash
  render(<MemoryRouter initialEntries={[pathname]}><Legal /></MemoryRouter>);
  expect(screen.getByRole("heading", { level: 1, name: "Terms of service" })).toBeInTheDocument();
  expect(meta({ location: { pathname } })).toContainEqual({ title: "Terms of service · Air Roam" });
  expect(meta({ location: { pathname } })).toContainEqual({ tagName: "link", rel: "canonical", href: "http://localhost:5173/terms" });
});
