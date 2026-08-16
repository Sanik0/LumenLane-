"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
  MoreHorizontal,
  Copy,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { SendPayment } from "@/components/send-payment";
import { ContractTransfer } from "@/components/contract-transfer";
import { ActivityFeed } from "@/components/activity-feed";
import { classifyError } from "@/lib/errors";
import { FeaturesSection } from "@/components/features-section";

import { AboutSection } from "@/components/about-section";
import { FaqSection } from "@/components/faq-section";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fundWithFriendbot } from "@/lib/stellar";
import { FREIGHTER_INSTALL_URL } from "@/lib/freighter";

function shorten(key: string): string {
  return `${key.slice(0, 6)}…${key.slice(-6)}`;
}

function TopNav({
  variant,
  right,
}: {
  variant: "landing" | "app";
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 font-semibold">
          <span className="bg-primary/20 text-primary flex size-8 items-center justify-center rounded-lg">
            <Sparkles className="size-4" />
          </span>
          Stellar Pay
        </div>
        {variant === "landing" && (
          <nav className="hidden items-center gap-6 text-sm sm:flex">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#about"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </a>
            <a
              href="#faq"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
            </a>
          </nav>
        )}
        {right ?? (
          <Badge variant="outline" className="border-primary/40 text-primary">
            Testnet
          </Badge>
        )}
      </div>
    </header>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group flex flex-col items-center gap-2 disabled:opacity-50"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-all group-enabled:group-hover:scale-105 group-enabled:group-hover:bg-white/20">
        <Icon className="size-5" />
      </span>
      <span className="text-xs font-medium text-white/80">{label}</span>
    </button>
  );
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
    sign,
  } = useWallet();
  const [funding, setFunding] = useState(false);

  async function handleConnect() {
    try {
      await connect();
      toast.success("Wallet connected");
    } catch (err) {
      const appErr = classifyError(err);
      toast.error(appErr.title, { description: appErr.message });
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

  function scrollToSend() {
    document.getElementById("send")?.scrollIntoView({ behavior: "smooth" });
  }

  /* ---------------- Connected: wallet dashboard ---------------- */
  if (address) {
    return (
      <>
        <TopNav
          variant="app"
          right={
            <Button variant="ghost" size="sm" onClick={disconnect}>
              Disconnect
            </Button>
          }
        />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
          {/* Balance card */}
          <div className="balance-gradient relative overflow-hidden rounded-3xl p-6 shadow-2xl shadow-indigo-950/40">
            <div className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-white/10 blur-2xl" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white/70">
                Current balance
              </span>
              <Badge className="bg-white/15 text-white hover:bg-white/15">
                XLM
              </Badge>
            </div>

            <div className="mt-3 flex items-end gap-2">
              {loadingBalance ? (
                <Skeleton className="h-11 w-48 bg-white/20" />
              ) : (
                <span className="text-4xl font-bold tracking-tight text-white tabular-nums">
                  {balance ?? "0"}
                </span>
              )}
              <span className="pb-1 text-lg text-white/60">XLM</span>
            </div>

            <button
              onClick={handleCopy}
              className="mt-2 flex items-center gap-1.5 font-mono text-xs text-white/60 transition-colors hover:text-white"
              title="Click to copy"
            >
              {shorten(address)}
              <Copy className="size-3" />
            </button>

            <div className="mt-6 flex justify-between gap-2">
              <ActionButton icon={ArrowUp} label="Send" onClick={scrollToSend} />
              <ActionButton icon={ArrowDown} label="Receive" onClick={handleCopy} />
              <ActionButton
                icon={ArrowLeftRight}
                label="Swap"
                onClick={() => toast.info("Swaps coming soon")}
              />
              <ActionButton
                icon={MoreHorizontal}
                label="More"
                onClick={() => toast.info("More options coming soon")}
              />
            </div>
          </div>

          {/* Manage */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => refreshBalance()}
              disabled={loadingBalance}
            >
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleFund} disabled={funding}>
              {funding ? "Funding…" : "Fund with Friendbot"}
            </Button>
          </div>

          {/* Smart-contract transfer (Soroban) */}
          <ContractTransfer
            address={address}
            sign={sign}
            onSuccess={() => refreshBalance()}
          />

          {/* Real-time contract event feed */}
          <ActivityFeed address={address} />

          {/* Classic Horizon payment form */}
          <div id="send" className="scroll-mt-20">
            <SendPayment
              address={address}
              sign={sign}
              onSuccess={() => refreshBalance()}
            />
          </div>

          <footer className="text-muted-foreground mt-auto pt-6 text-center text-xs">
            Built on the Stellar Testnet · Multi-wallet via Stellar Wallets Kit
          </footer>

        </main>
      </>
    );
  }

  /* ---------------- Not connected: landing page ---------------- */
  return (
    <>
      <TopNav variant="landing" />
      <main className="flex w-full flex-col">
        {/* Hero */}
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-4 pt-20 pb-10 text-center">
          <Reveal>
            <Badge variant="outline" className="border-primary/40 text-primary">
              Stellar Testnet dApp
            </Badge>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Move XLM in{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                seconds
              </span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="text-muted-foreground mx-auto max-w-xl text-lg">
              A fast, secure, self-custodial wallet interface for the Stellar
              network. Connect any supported wallet — Freighter, xBull, Albedo,
              Rabet, LOBSTR, or Hana — to check balances, call smart contracts,
              and send payments instantly.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="flex flex-col items-center gap-3">
              <Button size="lg" onClick={handleConnect} disabled={connecting}>
                {connecting ? "Connecting…" : "Connect Wallet"}
              </Button>
              <p className="text-muted-foreground text-xs">
                Don&apos;t have a wallet?{" "}
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
          </Reveal>
        </section>

        <FeaturesSection />
        <AboutSection />
        <FaqSection />

        {/* CTA */}
        <section className="mx-auto w-full max-w-3xl px-4 py-16">
          <Reveal>
            <div className="balance-gradient relative overflow-hidden rounded-3xl p-10 text-center shadow-2xl shadow-indigo-950/40">
              <div className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-white/10 blur-2xl" />
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Ready to get started?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-white/70">
                Connect your Stellar wallet and make your first testnet contract
                call in under a minute.
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="mt-6"
                onClick={handleConnect}
                disabled={connecting}
              >
                {connecting ? "Connecting…" : "Connect Wallet"}
              </Button>
            </div>
          </Reveal>
        </section>

        <footer className="text-muted-foreground border-t border-white/5 py-8 text-center text-xs">
          Built on the Stellar Testnet · Powered by Freighter &amp; Horizon
        </footer>
      </main>
    </>
  );
}
