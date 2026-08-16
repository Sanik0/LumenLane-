"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  transferViaContract,
  explorerTxUrl,
  explorerContractUrl,
  NATIVE_SAC_ID,
  type SignFn,
} from "@/lib/soroban";
import { isValidPublicKey } from "@/lib/stellar";
import { classifyError } from "@/lib/errors";

interface ContractTransferProps {
  address: string;
  sign: SignFn;
  onSuccess?: () => void;
}

type Phase =
  | "simulating"
  | "signing"
  | "submitting"
  | "confirming";

type TxStatus =
  | { state: "idle" }
  | { state: "pending"; phase: Phase }
  | { state: "success"; hash: string }
  | { state: "error"; message: string; hash?: string };

const PHASE_LABEL: Record<Phase, string> = {
  simulating: "Simulating contract call…",
  signing: "Awaiting wallet signature…",
  submitting: "Submitting to network…",
  confirming: "Confirming on ledger…",
};

function shorten(v: string): string {
  return `${v.slice(0, 6)}…${v.slice(-6)}`;
}

export function ContractTransfer({
  address,
  sign,
  onSuccess,
}: ContractTransferProps) {
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<TxStatus>({ state: "idle" });

  const isPending = status.state === "pending";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isValidPublicKey(destination)) {
      toast.error("Invalid destination", {
        description: "Enter a valid Stellar public key (starts with G).",
      });
      return;
    }
    const numeric = Number(amount);
    if (!amount || Number.isNaN(numeric) || numeric <= 0) {
      toast.error("Invalid amount", {
        description: "Enter an amount greater than 0.",
      });
      return;
    }

    setStatus({ state: "pending", phase: "simulating" });
    try {
      const result = await transferViaContract(
        { from: address, to: destination.trim(), amount, sign },
        (phase) => setStatus({ state: "pending", phase })
      );

      if (result.status === "SUCCESS") {
        setStatus({ state: "success", hash: result.hash });
        toast.success("Contract call confirmed!", {
          description: `Tx: ${result.hash.slice(0, 12)}…`,
        });
        setDestination("");
        setAmount("");
        onSuccess?.();
      } else {
        setStatus({
          state: "error",
          message: "Transaction failed on-chain.",
          hash: result.hash,
        });
        toast.error("Transaction failed", {
          description: "The contract call was rejected by the ledger.",
        });
      }
    } catch (err) {
      const appErr = classifyError(err);
      setStatus({ state: "error", message: appErr.message });
      toast.error(appErr.title, { description: appErr.message });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer via Smart Contract</CardTitle>
        <CardDescription>
          Calls the <code className="text-xs">transfer</code> function on the
          native XLM Stellar Asset Contract (Soroban) on Testnet.
        </CardDescription>
        <a
          href={explorerContractUrl(NATIVE_SAC_ID)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary mt-1 inline-block break-all font-mono text-xs underline underline-offset-4"
        >
          {NATIVE_SAC_ID}
        </a>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="c-destination">Recipient address</Label>
            <Input
              id="c-destination"
              placeholder="G..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="c-amount">Amount (XLM)</Label>
            <Input
              id="c-amount"
              type="number"
              min="0"
              step="0.0000001"
              placeholder="10"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? PHASE_LABEL[status.phase] : "Call transfer()"}
          </Button>

          {status.state === "pending" && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-500 hover:bg-amber-500">
                  Pending
                </Badge>
                <span className="text-muted-foreground">
                  {PHASE_LABEL[status.phase]}
                </span>
              </div>
            </div>
          )}

          {status.state === "success" && (
            <div className="rounded-md border border-green-600/30 bg-green-600/10 p-3 text-sm">
              <div className="mb-1 flex items-center gap-2">
                <Badge className="bg-green-600 hover:bg-green-600">
                  Success
                </Badge>
                <span className="text-muted-foreground">
                  Contract call confirmed on testnet.
                </span>
              </div>
              <p className="break-all font-mono text-xs">{status.hash}</p>
              <a
                href={explorerTxUrl(status.hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4"
              >
                View on Stellar Expert →
              </a>
            </div>
          )}

          {status.state === "error" && (
            <div className="border-destructive/30 bg-destructive/10 rounded-md border p-3 text-sm">
              <div className="mb-1 flex items-center gap-2">
                <Badge variant="destructive">Failed</Badge>
              </div>
              <p className="break-words">{status.message}</p>
              {status.hash && (
                <a
                  href={explorerTxUrl(status.hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4"
                >
                  View {shorten(status.hash)} on Stellar Expert →
                </a>
              )}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
