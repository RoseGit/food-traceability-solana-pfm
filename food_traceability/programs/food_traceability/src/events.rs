use crate::state::ActorRole;
use crate::state::BatchStatus;
use anchor_lang::prelude::*;

#[event]
pub struct BatchCreated {
    pub batch_id: u64,
    pub creator: Pubkey,
    pub product: String,
    pub origin: String,
    pub timestamp: i64,
}

#[event]
pub struct BatchEventRecorded {
    pub event_id: u64,
    pub batch_id: u64,
    pub event_type: String,
    pub actor: Pubkey,
    pub location: String,
    pub timestamp: i64,
}

#[event]
pub struct BatchStatusChanged {
    pub batch_id: u64,
    pub new_status: BatchStatus,
    pub timestamp: i64,
}

#[event]
pub struct CertificateIssued {
    pub certificate_id: u64,
    pub batch_id: u64,
    pub certificate_type: String,
    pub issuer: String,
    pub timestamp: i64,
}

#[event]
pub struct CertificateRevoked {
    pub certificate_id: u64,
    pub reason: String,
    pub timestamp: i64,
}

#[event]
pub struct ActorRegistered {
    pub actor_address: Pubkey,
    pub name: String,
    pub role: ActorRole,
    pub timestamp: i64,
}
