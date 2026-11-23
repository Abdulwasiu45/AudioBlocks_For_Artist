"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/api/queryClientInstance";
import { ReactNode } from "react";
import { StellarNetworkProvider } from "./StellarNetworkContext";
import { PlaybackProvider } from "./PlaybackContext";
import { ThemeProvider } from "./ThemeContext";
import PrivyProvider from "./PrivyProvider";
import { CurrencyPreferenceProvider } from "./CurrencyPreferenceContext";
import { StellarWalletProvider } from "@/components/common/wallet/StellarWalletProvider";

const Provider = ({ children }: { children: ReactNode }) => {
  return (
    <PrivyProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <CurrencyPreferenceProvider>
            <StellarNetworkProvider>
              <StellarWalletProvider>
                <PlaybackProvider>{children}</PlaybackProvider>
              </StellarWalletProvider>
            </StellarNetworkProvider>
          </CurrencyPreferenceProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
};

export default Provider;
