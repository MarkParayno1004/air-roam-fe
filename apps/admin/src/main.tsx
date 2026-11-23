import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./app.css";
import { StaffProvider } from "./auth/StaffProvider";
import { AppRoutes } from "./routes";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 15_000 } } });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <StaffProvider>
          <AppRoutes />
        </StaffProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
