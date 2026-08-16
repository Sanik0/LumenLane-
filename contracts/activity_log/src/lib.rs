#![no_std]

//! Activity Log — a tiny Soroban contract used to demonstrate the Level 2
//! flow with a *custom* contract (as an alternative to the native Stellar
//! Asset Contract the dApp uses out of the box).
//!
//! It lets any account post a short note. Each post:
//!   - increments a global counter (contract state / write)
//!   - is readable back via `total()` and `last()`   (read)
//!   - emits a `("post", author)` event with the note (event streaming)
//!
//! Build & deploy instructions live in `contracts/README.md`.

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Total,
    Last,
}

#[contract]
pub struct ActivityLog;

#[contractimpl]
impl ActivityLog {
    /// Post a note. Requires the author's authorization.
    pub fn post(env: Env, author: Address, note: String) -> u32 {
        author.require_auth();

        let total: u32 = env.storage().instance().get(&DataKey::Total).unwrap_or(0);
        let next = total + 1;

        env.storage().instance().set(&DataKey::Total, &next);
        env.storage().instance().set(&DataKey::Last, &note);

        // Emit an event so off-chain listeners (the dApp activity feed) can react.
        let topic: Symbol = symbol_short!("post");
        env.events().publish((topic, author), note);

        next
    }

    /// Total number of notes posted (read-only).
    pub fn total(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Total).unwrap_or(0)
    }

    /// The most recently posted note, if any (read-only).
    pub fn last(env: Env) -> Option<String> {
        env.storage().instance().get(&DataKey::Last)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env, String};

    #[test]
    fn posts_increment_total() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(ActivityLog, ());
        let client = ActivityLogClient::new(&env, &contract_id);

        let author = Address::generate(&env);
        assert_eq!(client.total(), 0);

        let n = client.post(&author, &String::from_str(&env, "gm"));
        assert_eq!(n, 1);
        assert_eq!(client.total(), 1);
        assert_eq!(client.last(), Some(String::from_str(&env, "gm")));
    }
}
