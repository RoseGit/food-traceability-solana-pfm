pub mod constants;
pub mod error;
pub mod events;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

// Importamos individualmente los módulos de instrucciones
// Esto ayuda al macro #[program] a encontrar los structs sin ambigüedad
use crate::error::FoodTraceabilityError;
use crate::events::BatchCreated;
use crate::instructions::accept_transfer::*;
use crate::instructions::approve_actor::*;
use crate::instructions::create_batch::*;
use crate::instructions::initialize::*;
use crate::instructions::initiate_transfer::*;
use crate::instructions::issue_certificate::*;
use crate::instructions::record_event::*;
use crate::instructions::reject_transfer::*;
use crate::instructions::request_role::*;
use crate::instructions::revoke_certificate::*;
use crate::instructions::update_status::*;
use crate::state::*;

declare_id!("Fw6zjywTLYyq7DLLQkiBGHgpKteCpgbamrHbXdiJdgCg");

#[program]
pub mod food_traceability {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        crate::instructions::initialize::handler(ctx)
    }

    // 2. Solicitud de Rol (Usuario/Actor)
    // Cambiamos 'register_actor' por 'request_role'
    pub fn request_role(
        ctx: Context<RequestRole>,
        name: String,
        role: state::ActorRole,
        location: String,
    ) -> Result<()> {
        instructions::request_role::handler(ctx, name, role, location)
    }

    // 3. Aprobación de Actor (Solo el Admin)
    // Nueva función para formalizar el registro
    pub fn approve_actor(ctx: Context<ApproveActor>) -> Result<()> {
        instructions::approve_actor::handler(ctx)
    }

    pub fn reject_role(ctx: Context<RejectRole>) -> Result<()> {
        let role_request = &mut ctx.accounts.role_request;
        role_request.status = RequestStatus::Rejected; // Asegúrate de tener este estado en tu Enum

        msg!("Solicitud rechazada para el usuario: {}", role_request.user);
        Ok(())
    }

    pub fn initiate_transfer(
        ctx: Context<InitiateTransfer>,
        quantity: u64,
        seed_nonce: u64, // Nuevo parámetro para hacer la PDA única
    ) -> Result<()> {
        crate::instructions::initiate_transfer::handler(ctx, quantity, seed_nonce)
    }

    pub fn accept_transfer(ctx: Context<AcceptTransfer>) -> Result<()> {
        crate::instructions::accept_transfer::handler(ctx)
    }

    pub fn reject_transfer(ctx: Context<RejectTransfer>) -> Result<()> {
        // Similar a accept, pero solo cambia el estado a Rejected
        // y no resta del batch original.
        crate::instructions::reject_transfer::handler(ctx)
    }

    pub fn create_batch(
        ctx: Context<CreateBatch>,
        id: u64,
        product: String,
        origin: String,
        quantity: u64,
        parent_sources: Vec<Pubkey>, // <-- Añadir aquí
    ) -> Result<()> {
        crate::instructions::create_batch::handler(
            ctx,
            id,
            product,
            origin,
            quantity,
            parent_sources,
        )
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
