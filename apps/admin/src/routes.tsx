import { Route, Routes } from "react-router";
import { RequireRole } from "./auth/RequireRole";
import { useStaff } from "./auth/StaffProvider";
import { Shell } from "./layout/Shell";
import { Login } from "./pages/Login";
import { Overview } from "./pages/Overview";
import { BookingsList } from "./pages/bookings/BookingsList";
import { OrderDetail } from "./pages/orders/OrderDetail";
import { OrdersList } from "./pages/orders/OrdersList";
import { ProductEditor } from "./pages/products/ProductEditor";
import { ProductsList } from "./pages/products/ProductsList";
import { UserEditor } from "./pages/users/UserEditor";
import { UsersList } from "./pages/users/UsersList";

export function AppRoutes() {
  const { status } = useStaff();
  if (status === "loading") return <p className="p-10 text-center text-muted">Loading…</p>;
  if (status === "out") return <Login />;
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Overview />} />
        <Route path="orders" element={<OrdersList />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="bookings" element={<BookingsList />} />
        <Route path="products" element={<ProductsList />} />
        <Route path="products/new" element={<ProductEditor />} />
        <Route path="products/:id" element={<ProductEditor />} />
        <Route path="users" element={<RequireRole role="admin"><UsersList /></RequireRole>} />
        <Route path="users/new" element={<RequireRole role="admin"><UserEditor /></RequireRole>} />
        <Route path="users/:id" element={<RequireRole role="admin"><UserEditor /></RequireRole>} />
        <Route path="*" element={<p className="text-muted">Page not found.</p>} />
      </Route>
    </Routes>
  );
}
