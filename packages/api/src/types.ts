/** Named aliases for the generated OpenAPI schema (regenerate with `npm run gen:api`). */
import type { components } from "./schema";

type S = components["schemas"];

export type User = S["User"];
export type Product = S["Product"];
export type Variant = S["Variant"];
export type Destination = S["Destination"];
export type PackGroup = S["PackGroup"];
export type Pack = S["Pack"];
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
export type StaffVariant = S["StaffVariant"];
export type StaffUser = S["StaffUser"];

export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
