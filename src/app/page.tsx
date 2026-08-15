"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/hooks/use-wallet";
import { SendPayment } from "@/components/send-payment";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { fundWithFriendbot } from "@/lib/stellar";
import { FREIGHTER_INSTALL_URL } from "@/lib/freighter";

function shorten(key: string): string {
  return `${key.slice(0, 6)}…${key.slice(-6)}`;
}

export default function Home() {
  const {
    address,
    balance,
    connecting,
    loadingBalance,
    connect,
    disconnect,
    refreshBalance,
  } = useWallet();
  const [funding, setFunding] = useState(false);

  async function handleConnect() {
    try {
      await connect();
      toast.success("Wallet connected");
    } catch (err) {
      toast.error("Connection failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  async function handleFund() {
    if (!address) return;
    setFunding(true);
    try {
      await fundWithFriendbot(address);
      toast.success("Funded with 10,000 testnet XLM");
      await refreshBalance();
    } catch (err) {
      toast.error("Funding failed", {
        description:
          err instanceof Error ? err.message : "Account may already be funded.",
      });
    } finally {
      setFunding(false);
    }
  }

  function handleCopy() {
    if (!address) return;
    navigator.clipboard.writeText(address);
    toast.success("Address copied");
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Stellar Pay</h1>
          <Badge variant="outline">Testnet</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Connect Freighter, check your XLM balance, and send payments on the
          Stellar Testnet.
        </p>
      </header>

      {/* Wallet card */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet</CardTitle>
          <CardDescription>
            {address
              ? "Your Freighter wallet is connected."
              : "Connect your Freighter wallet to get started."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!address ? (
            <div className="flex flex-col gap-3">
              <Button onClick={handleConnect} disabled={connecting}>
                {connecting ? "Connecting…" : "Connect Freighter"}
              </Button>
              <p className="text-muted-foreground text-xs">
                Don&apos;t have Freighter?{" "}
                <a
                  href={FREIGHTER_INSTALL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4"
                >
                  Install it here
                </a>
                .
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">Address</span>
                <button
                  onClick={handleCopy}
                  className="w-fit font-mono text-sm underline-offset-4 hover:underline"
                  title="Click to copy"
                >
                  {shorten(address)}
                </button>
              </div>

              <Separator />

              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">
                  XLM Balance
                </span>
                {loadingBalance ? (
                  <Skeleton className="h-9 w-40" />
                ) : (
                  <span className="text-3xl font-semibold tabular-nums">
                    {balance ?? "0"}{" "}
                    <span className="text-muted-foreground text-base font-normal">
                      XLM
                    </span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => refreshBalance()}
                  disabled={loadingBalance}
                >
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  onClick={handleFund}
                  disabled={funding}
                >
                  {funding ? "Funding…" : "Fund with Friendbot"}
                </Button>
                <Button variant="ghost" onClick={disconnect}>
                  Disconnect
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment form */}
      {address && (
        <SendPayment address={address} onSuccess={() => refreshBalance()} />
      )}

      <footer className="text-muted-foreground mt-auto pt-6 text-center text-xs">
        Built on the Stellar Testnet · Powered by Freighter &amp; Horizon
      </footer>
    </main>
  );
}
