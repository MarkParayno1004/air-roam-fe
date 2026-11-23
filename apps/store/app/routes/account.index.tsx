import { Navigate } from "react-router";

export default function AccountIndex() {
  return <Navigate to="/account/orders" replace />;
}
