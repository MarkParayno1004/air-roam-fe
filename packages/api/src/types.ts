/** Named aliases for the generated OpenAPI schema (regenerate with `npm run gen:api`). */
import type { components } from "./schema";

type S = components["schemas"];

export type User = S["User"];
export type Product = S["Product"];
export type Plan = S["Plan"];
export type WifiPlan = S["WifiPlan"];
export type Destination = S["Destination"];
export type Order = S["Order"];
export type OrderLine = S["OrderLine"];
export type Booking = S["Booking"];
export type BookingDetail = S["BookingDetail"];
export type CheckoutResponse = S["CheckoutResponse"];
export type PriceUpdate = S["PriceUpdate"];
export type RemovedLine = S["RemovedLine"];
export type Session = S["Session"];
export type StaffOrder = S["StaffOrder"];
export type StaffBooking = S["StaffBooking"];
export type StaffBookingUpdateResponse = S["StaffBookingUpdateResponse"];
export type StaffProduct = S["StaffProduct"];
export type StaffCountry = S["StaffCountry"];
export type StaffRegion = S["StaffRegion"];
export type StaffPlan = S["StaffPlan"];
export type StaffUser = S["StaffUser"];

export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
