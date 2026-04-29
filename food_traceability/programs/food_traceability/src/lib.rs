pub mod constants;
pub mod error;
pub mod events;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

// Importamos individualmente los módulos de instrucciones
// Esto ayuda al macro #[program] a encontrar los structs sin ambigüedad
use crate::instructions::create_batch::*;
use crate::instructions::initialize::*;
use crate::instructions::issue_certificate::*;
use crate::instructions::record_event::*;
use crate::instructions::register_actor::*;
use crate::instructions::revoke_certificate::*;
use crate::instructions::update_status::*;

use crate::error::FoodTraceabilityError;
use crate::events::BatchCreated;

declare_id!("Fw6zjywTLYyq7DLLQkiBGHgpKteCpgbamrHbXdiJdgCg");

#[program]
pub mod food_traceability {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        crate::instructions::initialize::handler(ctx)
    }

    pub fn register_actor(
        ctx: Context<RegisterActor>,
        name: String,
        role: state::ActorRole,
        location: String,
    ) -> Result<()> {
        crate::instructions::register_actor::handler(ctx, name, role, location)
    }

    pub fn create_batch(
        ctx: Context<CreateBatch>,
        id: u64,
        product: String,
        origin: String,
        quantity: u64,
    ) -> Result<()> {
        crate::instructions::create_batch::handler(ctx, id, product, origin, quantity)
    }

    pub fn record_event(
        ctx: Context<RecordEvent>,
        batch_id: u64,
        event_type: String,
        location: String,
        metadata: String,
    ) -> Result<()> {
        crate::instructions::record_event::handler(ctx, batch_id, event_type, location, metadata)
    }

    pub fn update_status(
        ctx: Context<UpdateBatchStatus>,
        batch_id: u64,
        new_status: state::BatchStatus,
    ) -> Result<()> {
        crate::instructions::update_status::handler(ctx, batch_id, new_status)
    }

    pub fn issue_certificate(
        ctx: Context<IssueCertificate>,
        batch_id: u64,
        cert_type: String,
        issuer: String,
        document_hash: String,
        expiry_date: i64,
    ) -> Result<()> {
        crate::instructions::issue_certificate::handler(
            ctx,
            batch_id,
            cert_type,
            issuer,
            document_hash,
            expiry_date,
        )
    }

    pub fn revoke_certificate(
        ctx: Context<RevokeCertificate>,
        batch_id: u64,
        certificate_id: u64,
        reason: String,
    ) -> Result<()> {
        crate::instructions::revoke_certificate::revoke_handler(
            ctx,
            batch_id,
            certificate_id,
            reason,
        )
    }
}
