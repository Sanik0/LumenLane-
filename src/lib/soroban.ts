/**
 * Soroban smart-contract integration.
 *
 * We interact with the **Stellar Asset Contract (SAC)** for native XLM — a real
 * smart contract deployed on the Stellar Testnet. This lets us demonstrate the
 * full Level 2 contract flow without a custom Rust toolchain:
 *
 *  - reading state:   `balance(address) -> i128`   (via simulation, no fee)
 *  - writing state:   `transfer(from, to, amount)`  (signed + submitted)
 *  - event streaming: contract `transfer` events polled from the RPC
 *  - status tracking: pending → success / failed
 *
 * The SAC address is deterministic per-network, so it is effectively an
 * always-available deployed contract. See README for the exact address and a
 * bundled custom contract you can deploy in its place.
 */

import {
  Asset,
  Contract,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  rpc,
} from "@stellar/stellar-sdk";

export const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;

/** Native XLM Stellar Asset Contract address on Testnet. */
export const NATIVE_SAC_ID = Asset.native().contractId(NETWORK_PASSPHRASE);

/** XLM has 7 decimal places (1 XLM = 10,000,000 stroops). */
const STROOPS_PER_XLM = 10_000_000n;

export function getRpcServer(): rpc.Server {
  return new rpc.Server(SOROBAN_RPC_URL, { allowHttp: false });
}

export function explorerContractUrl(contractId: string): string {
  return `https://stellar.expert/explorer/testnet/contract/${contractId}`;
}

export function explorerTxUrl(hash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}

/** Convert a decimal XLM string to a stroops BigInt. */
export function xlmToStroops(amount: string): bigint {
  const [whole, fraction = ""] = amount.trim().split(".");
  const fractionPadded = (fraction + "0000000").slice(0, 7);
  return BigInt(whole || "0") * STROOPS_PER_XLM + BigInt(fractionPadded || "0");
}

/** Convert a stroops BigInt back into a human-readable XLM string. */
export function stroopsToXlm(stroops: bigint): string {
  const negative = stroops < 0n;
  const abs = negative ? -stroops : stroops;
  const whole = abs / STROOPS_PER_XLM;
  const frac = (abs % STROOPS_PER_XLM).toString().padStart(7, "0").replace(/0+$/, "");
  const sign = negative ? "-" : "";
  return frac ? `${sign}${whole}.${frac}` : `${sign}${whole}`;
}

/**
 * Read an account's XLM balance by calling the SAC `balance` function.
 * This is a read-only contract invocation performed purely via simulation —
 * no transaction is submitted and no fee is paid.
 */
export async function readContractBalance(address: string): Promise<string> {
  const server = getRpcServer();
  const contract = new Contract(NATIVE_SAC_ID);

  let account;
  try {
    account = await server.getAccount(address);
  } catch {
    // Account not funded yet → balance is 0.
    return "0";
  }

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call("balance", nativeToScVal(address, { type: "address" }))
    )
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error);
  }
  if (!sim.result?.retval) return "0";

  const raw = scValToNative(sim.result.retval) as bigint | number;
  return stroopsToXlm(BigInt(raw));
}

export type SignFn = (xdr: string, address: string) => Promise<string>;

export interface TransferResult {
  hash: string;
  /** Final ledger-confirmed status. */
  status: "SUCCESS" | "FAILED";
}

/**
 * Write to the contract: invoke SAC `transfer(from, to, amount)`.
 *
 * Flow: build → simulate (to gather Soroban auth + resource fees) → assemble
 * → sign with the connected wallet → submit → poll until confirmed.
 *
 * `onStatus` is invoked with coarse progress so the UI can show pending states.
 */
export async function transferViaContract(
  {
    from,
    to,
    amount,
    sign,
  }: { from: string; to: string; amount: string; sign: SignFn },
  onStatus?: (status: "simulating" | "signing" | "submitting" | "confirming") => void
): Promise<TransferResult> {
  const server = getRpcServer();
  const contract = new Contract(NATIVE_SAC_ID);
  const account = await server.getAccount(from);

  const amountScVal = nativeToScVal(xlmToStroops(amount), { type: "i128" });

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "transfer",
        nativeToScVal(from, { type: "address" }),
        nativeToScVal(to, { type: "address" }),
        amountScVal
      )
    )
    .setTimeout(180)
    .build();

  onStatus?.("simulating");
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error);
  }

  const prepared = rpc.assembleTransaction(tx, sim).build();

  onStatus?.("signing");
  const signedXdr = await sign(prepared.toXDR(), from);
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  onStatus?.("submitting");
  const sendResult = await server.sendTransaction(signedTx);
  if (sendResult.status === "ERROR") {
    throw new Error(
      sendResult.errorResult
        ? JSON.stringify(sendResult.errorResult)
        : "Transaction submission failed."
    );
  }

  onStatus?.("confirming");
  const hash = sendResult.hash;
  const final = await waitForTransaction(server, hash);

  if (final?.status === rpc.Api.GetTransactionStatus.SUCCESS) {
    return { hash, status: "SUCCESS" };
  }
  return { hash, status: "FAILED" };
}

async function waitForTransaction(
  server: rpc.Server,
  hash: string,
  maxAttempts = 15
): Promise<rpc.Api.GetTransactionResponse | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await server.getTransaction(hash);
    if (res.status !== rpc.Api.GetTransactionStatus.NOT_FOUND) {
      return res;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
}

export interface TransferEvent {
  id: string;
  ledger: number;
  from: string;
  to: string;
  amount: string;
  txHash?: string;
}

/**
 * Fetch recent `transfer` events emitted by the SAC contract. Used to build a
 * real-time activity feed by polling on an interval.
 */
export async function fetchTransferEvents(limit = 15): Promise<TransferEvent[]> {
  const server = getRpcServer();
  const latest = await server.getLatestLedger();
  // RPC retains a limited window of ledgers; look back ~ the last hour.
  const startLedger = Math.max(latest.sequence - 8000, 1);

  const resp = await server.getEvents({
    startLedger,
    filters: [
      {
        type: "contract",
        contractIds: [NATIVE_SAC_ID],
        topics: [[nativeToScVal("transfer", { type: "symbol" }).toXDR("base64"), "*", "*", "*"]],
      },
    ],
    limit: 100,
  });

  const events: TransferEvent[] = [];
  for (const ev of resp.events) {
    try {
      // topics: [Symbol("transfer"), from:Address, to:Address, sep0011 asset]
      const topics = ev.topic.map((t) => scValToNative(t));
      const from = String(topics[1] ?? "");
      const to = String(topics[2] ?? "");
      const value = scValToNative(ev.value) as bigint | number;
      events.push({
        id: ev.id,
        ledger: ev.ledger,
        from,
        to,
        amount: stroopsToXlm(BigInt(value)),
        txHash: ev.txHash,
      });
    } catch {
      // skip malformed events
    }
  }

  return events.reverse().slice(0, limit);
}
