"use client";

import { AppProvider } from "../../lib/context/AppContext";
import { ToastProvider } from "../ui/Toast";
import NetworkStatus from "../ui/NetworkStatus";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <ToastProvider>
        <NetworkStatus />
        {children}
      </ToastProvider>
    </AppProvider>
  );
}
