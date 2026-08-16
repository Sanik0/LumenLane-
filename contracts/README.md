# Soroban Contracts

This directory contains an optional **custom Soroban contract** (`activity_log`)
that you can build, test, and deploy to the Stellar Testnet.

> The web app itself talks to the **native XLM Stellar Asset Contract (SAC)** —
> an always-deployed Soroban contract — so it works with no Rust toolchain.
> This folder is here to satisfy the "deploy your first smart contract" learning
> goal and to give reviewers a contract they can deploy themselves.

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) with the `wasm32v1-none`
  (or `wasm32-unknown-unknown`) target
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli/install-cli)

```bash
rustup target add wasm32v1-none
```

## Test

```bash
cd contracts/activity_log
cargo test
```

## Build

```bash
cd contracts/activity_log
stellar contract build
# -> ../../target/wasm32v1-none/release/activity_log.wasm
```

## Deploy to Testnet

```bash
# 1. Create & fund an identity
stellar keys generate --global deployer --network testnet --fund

# 2. Deploy
stellar contract deploy \
  --wasm target/wasm32v1-none/release/activity_log.wasm \
  --source deployer \
  --network testnet
# -> prints the deployed contract ID (C...)
```

## Invoke

```bash
# Read-only
stellar contract invoke --id <CONTRACT_ID> --source deployer --network testnet -- total

# Write (emits a "post" event)
stellar contract invoke --id <CONTRACT_ID> --source deployer --network testnet \
  -- post --author <G...> --note "gm from testnet"
```

## Contract API

| Function | Kind  | Description                                   |
| -------- | ----- | --------------------------------------------- |
| `post`   | write | Store a note, bump the counter, emit an event |
| `total`  | read  | Number of notes posted                        |
| `last`   | read  | The most recent note                          |
