"use client";

/**
 * Multi-wallet integration powered by Stellar Wallets Kit.
 *
 * Instead of talking to a single wallet (Freighter) directly, we let the user
 * pick from any supported wallet — Freighter, xBull, Albedo, Rabet, LOBSTR,
 * Hana — through a single modal. The kit normalises connection and signing
 * across all of them.
 */

import {
  StellarWalletsKit,
  Networks,
  SwkAppDarkTheme,
} from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { RabetModule } from "@creit.tech/stellar-wallets-kit/modules/rabet";
import { LobstrModule } from "@creit.tech/stellar-wallets-kit/modules/lobstr";
import { HanaModule } from "@creit.tech/stellar-wallets-kit/modules/hana";

/** The list of wallets we advertise in the connection modal. */
export const SUPPORTED_WALLETS = [
  "Freighter",
  "xBull",
  "Albedo",
  "Rabet",
  "LOBSTR",
  "Hana",
] as const;

let initialized = false;

/**
 * Initialise the kit once, on the client only. Safe to call repeatedly.
 */
function ensureInit(): void {
  if (initialized || typeof window === "undefined") return;
  StellarWalletsKit.init({
    network: Networks.TESTNET,
    modules: [
      new FreighterModule(),
      new xBullModule(),
      new AlbedoModule(),
      new RabetModule(),
      new LobstrModule(),
      new HanaModule(),
    ],
    theme: SwkAppDarkTheme,
  });
  initialized = true;
}

/**
 * Open the wallet-selection modal and resolve with the connected public key.
 * Rejects if the user closes the modal or the wallet errors.
 */
export async function openWalletModal(): Promise<string> {
  ensureInit();
  const { address } = await StellarWalletsKit.authModal();
  return address;
}

/**
 * Return the currently-connected address without prompting, if any.
 */
export async function getConnectedAddress(): Promise<string | null> {
  ensureInit();
  try {
    const { address } = await StellarWalletsKit.getAddress();
    return address || null;
  } catch {
    return null;
  }
}

/**
 * Sign a transaction XDR with the active wallet and return the signed XDR.
 */
export async function signXdr(xdr: string, address: string): Promise<string> {
  ensureInit();
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    address,
    networkPassphrase: Networks.TESTNET,
  });
  return signedTxXdr;
}

/**
 * Disconnect the active wallet and clear kit state.
 */
export async function disconnectWallet(): Promise<void> {
  ensureInit();
  try {
    await StellarWalletsKit.disconnect();
  } catch {
    // ignore — some modules have nothing to tear down
  }
}
