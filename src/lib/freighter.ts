import {
  isConnected,
  isAllowed,
  setAllowed,
  requestAccess,
  getAddress,
  getNetwork,
  signTransaction,
} from "@stellar/freighter-api";
import { NETWORK_PASSPHRASE } from "@/lib/stellar";

export const FREIGHTER_INSTALL_URL = "https://www.freighter.app/";

/**
 * Returns true if the Freighter browser extension is installed.
 */
export async function isFreighterInstalled(): Promise<boolean> {
  try {
    const res = await isConnected();
    return !!res.isConnected;
  } catch {
    return false;
  }
}

/**
 * Prompt the user to connect their Freighter wallet and return the public key.
 * Throws a descriptive error if the connection is refused or the extension
 * is missing.
 */
export async function connectWallet(): Promise<string> {
  const installed = await isFreighterInstalled();
  if (!installed) {
    throw new Error(
      "Freighter wallet not detected. Please install the Freighter extension."
    );
  }

  const allowed = await isAllowed();
  if (!allowed.isAllowed) {
    await setAllowed();
  }

  const access = await requestAccess();
  if (access.error) {
    throw new Error(access.error);
  }
  if (!access.address) {
    throw new Error("No account returned by Freighter.");
  }
  return access.address;
}

/**
 * Read the currently authorized address without prompting, if any.
 */
export async function getConnectedAddress(): Promise<string | null> {
  try {
    const allowed = await isAllowed();
    if (!allowed.isAllowed) return null;
    const res = await getAddress();
    if (res.error || !res.address) return null;
    return res.address;
  } catch {
    return null;
  }
}

/**
 * Ensure the wallet is currently pointed at the Stellar Testnet.
 */
export async function assertTestnet(): Promise<void> {
  const net = await getNetwork();
  if (net.error) {
    throw new Error(net.error);
  }
  if (net.networkPassphrase && net.networkPassphrase !== NETWORK_PASSPHRASE) {
    throw new Error(
      "Freighter is not set to Testnet. Please switch the network to Testnet in the extension."
    );
  }
}

/**
 * Sign a transaction XDR with Freighter and return the signed XDR.
 */
export async function signWithFreighter(
  xdr: string,
  address: string
): Promise<string> {
  const result = await signTransaction(xdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
    address,
  });
  if (result.error) {
    throw new Error(result.error);
  }
  return result.signedTxXdr;
}
