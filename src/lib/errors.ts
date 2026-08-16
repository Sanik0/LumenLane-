/**
 * Centralised error classification for the dApp.
 *
 * Level 2 requires at least three distinct, explicitly-handled error types.
 * We normalise the many shapes of errors thrown by wallets, Horizon, and the
 * Soroban RPC into a small set of well-known kinds so the UI can react with
 * clear, actionable messaging.
 */

export type AppErrorKind =
  | "wallet_not_found"
  | "user_rejected"
  | "insufficient_balance"
  | "wrong_network"
  | "network"
  | "unknown";

export interface AppError {
  kind: AppErrorKind;
  title: string;
  message: string;
}

function messageOf(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const anyErr = err as { message?: string; error?: { message?: string } };
    return anyErr.error?.message ?? anyErr.message ?? JSON.stringify(err);
  }
  return "Unknown error";
}

/**
 * Classify an arbitrary thrown value into a well-known {@link AppError}.
 */
export function classifyError(err: unknown): AppError {
  const raw = messageOf(err).toLowerCase();

  // 1) Wallet not installed / not detected
  if (
    raw.includes("not detected") ||
    raw.includes("not installed") ||
    raw.includes("no wallet") ||
    raw.includes("is not an existing module") ||
    raw.includes("could not be found")
  ) {
    return {
      kind: "wallet_not_found",
      title: "Wallet not found",
      message:
        "We couldn't detect a compatible Stellar wallet. Install Freighter (or another supported wallet) and try again.",
    };
  }

  // 2) User rejected / cancelled the request in their wallet
  if (
    raw.includes("reject") ||
    raw.includes("declined") ||
    raw.includes("denied") ||
    raw.includes("cancel") ||
    raw.includes("closed the modal") ||
    raw.includes("user closed")
  ) {
    return {
      kind: "user_rejected",
      title: "Request rejected",
      message: "You declined the request in your wallet. No changes were made.",
    };
  }

  // 3) Insufficient balance to cover the transfer or fees
  if (
    raw.includes("insufficient") ||
    raw.includes("underfunded") ||
    raw.includes("tx_insufficient_balance") ||
    raw.includes("op_underfunded") ||
    raw.includes("balance is not sufficient") ||
    raw.includes("#12") // SAC transfer: balance too low
  ) {
    return {
      kind: "insufficient_balance",
      title: "Insufficient balance",
      message:
        "Your account doesn't have enough XLM to complete this transfer (including network fees).",
    };
  }

  // 4) Wallet pointed at the wrong network
  if (raw.includes("testnet") && raw.includes("network")) {
    return {
      kind: "wrong_network",
      title: "Wrong network",
      message: "Switch your wallet to the Stellar Testnet and try again.",
    };
  }

  // 5) Network / RPC connectivity problems
  if (
    raw.includes("failed to fetch") ||
    raw.includes("network error") ||
    raw.includes("timeout") ||
    raw.includes("econnrefused") ||
    raw.includes("503") ||
    raw.includes("504")
  ) {
    return {
      kind: "network",
      title: "Network error",
      message:
        "Couldn't reach the Stellar network. Check your connection and try again.",
    };
  }

  return {
    kind: "unknown",
    title: "Something went wrong",
    message: messageOf(err),
  };
}
