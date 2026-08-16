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
  buildPaymentXdr,
  submitSignedXdr,
  explorerTxUrl,
  isValidPublicKey,
} from "@/lib/stellar";
import { classifyError } from "@/lib/errors";

interface SendPaymentProps {
  address: string;
  sign: (xdr: string, address: string) => Promise<string>;
  onSuccess?: () => void;
}


type TxStatus =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "success"; hash: string }
  | { state: "error"; message: string };

export function SendPayment({ address, sign, onSuccess }: SendPaymentProps) {
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<TxStatus>({ state: "idle" });

  const isSending = status.state === "sending";

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

    setStatus({ state: "sending" });
    try {
      const xdr = await buildPaymentXdr({
        source: address,
        destination: destination.trim(),
        amount,
      });
      const signed = await sign(xdr, address);
      const hash = await submitSignedXdr(signed);

      setStatus({ state: "success", hash });
      toast.success("Payment sent!", {
        description: `Tx: ${hash.slice(0, 12)}…`,
      });
      setDestination("");
      setAmount("");
      onSuccess?.();
    } catch (err) {
      const appErr = classifyError(err);
      setStatus({ state: "error", message: appErr.message });
      toast.error(appErr.title, { description: appErr.message });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send XLM</CardTitle>
        <CardDescription>
          Send a testnet payment to any Stellar address.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="destination">Destination address</Label>
            <Input
              id="destination"
              placeholder="G..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Amount (XLM)</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.0000001"
              placeholder="10"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={isSending}>
            {isSending ? "Sending…" : "Send Payment"}
          </Button>

          {status.state === "success" && (
            <div className="rounded-md border border-green-600/30 bg-green-600/10 p-3 text-sm">
              <div className="mb-1 flex items-center gap-2">
                <Badge className="bg-green-600 hover:bg-green-600">
                  Success
                </Badge>
                <span className="text-muted-foreground">
                  Transaction confirmed on testnet.
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
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
              <div className="mb-1 flex items-center gap-2">
                <Badge variant="destructive">Failed</Badge>
              </div>
              <p className="break-words">{status.message}</p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
