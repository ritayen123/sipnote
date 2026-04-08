"use client";

import { AppProvider } from "../../lib/context/AppContext";
import { ToastProvider } from "../ui/Toast";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AppProvider>
  );
}
