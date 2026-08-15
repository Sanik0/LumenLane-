import {
  Asset,
  BASE_FEE,
  Horizon,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

// Public Stellar Testnet configuration
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const FRIENDBOT_URL = "https://friendbot.stellar.org";

export const server = new Horizon.Server(HORIZON_URL);

export interface AccountBalance {
  xlm: string;
  raw: Horizon.HorizonApi.BalanceLine[];
}

/**
 * Fetch the native (XLM) balance for a given public key.
 * Returns "0" if the account is not yet funded on the network.
 */
export async function fetchBalance(publicKey: string): Promise<AccountBalance> {
  try {
    const account = await server.loadAccount(publicKey);
    const native = account.balances.find((b) => b.asset_type === "native");
    return {
      xlm: native ? native.balance : "0",
      raw: account.balances,
    };
  } catch (err: unknown) {
    // A 404 means the account has not been created/funded yet.
    if (isNotFound(err)) {
      return { xlm: "0", raw: [] };
    }
    throw err;
  }
}

/**
 * Request testnet XLM from Friendbot for an unfunded account.
 */
export async function fundWithFriendbot(publicKey: string): Promise<void> {
  const res = await fetch(`${FRIENDBOT_URL}/?addr=${encodeURIComponent(publicKey)}`);
  if (!res.ok) {
    const body = await res.text();
    // Friendbot returns an error if the account is already funded.
    throw new Error(`Friendbot funding failed: ${body || res.statusText}`);
  }
}

export interface BuildPaymentParams {
  source: string;
  destination: string;
  amount: string;
  memo?: string;
}

/**
 * Build an unsigned payment transaction and return its XDR representation,
 * ready to be signed by Freighter.
 */
export async function buildPaymentXdr({
  source,
  destination,
  amount,
}: BuildPaymentParams): Promise<string> {
  const account = await server.loadAccount(source);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination,
        asset: Asset.native(),
        amount,
      })
    )
    .setTimeout(180)
    .build();

  return tx.toXDR();
}

/**
 * Submit a signed transaction (XDR) to the network and return the tx hash.
 */
export async function submitSignedXdr(signedXdr: string): Promise<string> {
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const result = await server.submitTransaction(tx);
  return result.hash;
}

export function explorerTxUrl(hash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}

export function isValidPublicKey(key: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(key.trim());
}

function isNotFound(err: unknown): boolean {
  if (typeof err === "object" && err !== null) {
    const anyErr = err as { response?: { status?: number }; message?: string };
    if (anyErr.response?.status === 404) return true;
    if (anyErr.message?.includes("404")) return true;
  }
  return false;
}
