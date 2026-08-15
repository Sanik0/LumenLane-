"use client";

import { useCallback, useEffect, useState } from "react";
import {
  connectWallet,
  getConnectedAddress,
  assertTestnet,
} from "@/lib/freighter";
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

  const refreshBalance = useCallback(async (pubKey?: string) => {
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
  }, [address]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const pubKey = await connectWallet();
      await assertTestnet();
      setAddress(pubKey);
      await refreshBalance(pubKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
      throw err;
    } finally {
      setConnecting(false);
    }
  }, [refreshBalance]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setBalance(null);
    setError(null);
  }, []);

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
  };
}
