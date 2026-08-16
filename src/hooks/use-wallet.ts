"use client";

import { useCallback, useEffect, useState } from "react";
import {
  openWalletModal,
  getConnectedAddress,
  disconnectWallet,
  signXdr,
} from "@/lib/wallet-kit";
import { fetchBalance } from "@/lib/stellar";

export interface WalletState {
  address: string | null;
  balance: string | null;
  connecting: boolean;
  loadingBalance: boolean;
  error: string | null;
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshBalance = useCallback(
    async (pubKey?: string) => {
      const key = pubKey ?? address;
      if (!key) return;
      setLoadingBalance(true);
      try {
        const result = await fetchBalance(key);
        setBalance(result.xlm);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch balance");
      } finally {
        setLoadingBalance(false);
      }
    },
    [address]
  );

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const pubKey = await openWalletModal();
      setAddress(pubKey);
      await refreshBalance(pubKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
      throw err;
    } finally {
      setConnecting(false);
    }
  }, [refreshBalance]);

  const disconnect = useCallback(async () => {
    await disconnectWallet();
    setAddress(null);
    setBalance(null);
    setError(null);
  }, []);

  // Sign helper bound to the currently connected address.
  const sign = useCallback(
    (xdr: string, addr: string) => signXdr(xdr, addr),
    []
  );

  // Attempt to silently restore an already-authorized session on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      const existing = await getConnectedAddress();
      if (active && existing) {
        setAddress(existing);
        refreshBalance(existing);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    address,
    balance,
    connecting,
    loadingBalance,
    error,
    connect,
    disconnect,
    refreshBalance,
    sign,
  };
}
