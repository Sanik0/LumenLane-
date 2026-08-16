"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Radio } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  fetchTransferEvents,
  explorerTxUrl,
  type TransferEvent,
} from "@/lib/soroban";

/** How often we poll the RPC for new contract events. */
const POLL_INTERVAL_MS = 8000;

function shorten(v: string): string {
  if (!v || v.length < 14) return v;
  return `${v.slice(0, 6)}…${v.slice(-6)}`;
}

interface ActivityFeedProps {
  /** Highlight events involving this address. */
  address?: string | null;
}

export function ActivityFeed({ address }: ActivityFeedProps) {
  const [events, setEvents] = useState<TransferEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const seen = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchTransferEvents(15);
      setEvents(next);
      next.forEach((e) => seen.current.add(e.id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    if (!live) return;
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load, live]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Live Activity Feed
              {live && (
                <span className="flex items-center gap-1 text-xs font-normal text-green-500">
                  <Radio className="size-3 animate-pulse" /> live
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Real-time <code className="text-xs">transfer</code> events streamed
              from the SAC contract.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLive((v) => !v)}
              className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4"
            >
              {live ? "Pause" : "Resume"}
            </button>
            <button
              onClick={load}
              disabled={loading}
              className="text-muted-foreground hover:text-foreground"
              title="Refresh now"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-destructive mb-3 text-sm">{error}</p>
        )}
        {events.length === 0 && !loading && (
          <p className="text-muted-foreground text-sm">
            No recent transfer events found.
          </p>
        )}
        <ul className="flex flex-col divide-y divide-white/5">
          {events.map((e) => {
            const mine =
              address && (e.from === address || e.to === address);
            return (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{shorten(e.from)}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-mono text-xs">{shorten(e.to)}</span>
                    {mine && (
                      <Badge variant="outline" className="text-[10px]">
                        you
                      </Badge>
                    )}
                  </div>
                  <span className="text-muted-foreground text-[11px]">
                    ledger {e.ledger}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="tabular-nums">{e.amount} XLM</span>
                  {e.txHash && (
                    <a
                      href={explorerTxUrl(e.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-[11px] underline underline-offset-2"
                    >
                      view
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
