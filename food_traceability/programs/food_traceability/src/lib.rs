pub mod constants;
pub mod error;
pub use error::*;
pub mod events;
pub mod instructions;
pub mod state; // Declara el archivo events.rs como módulo
pub use events::*; // Exporta todo lo que hay dentro a la raíz del crate

use crate::{
    instructions::{
        create_batch::CreateBatch, issue_certificate::IssueCertificate, record_event::RecordEvent,
        register_actor::RegisterActor, revoke_certificate::RevokeCertificate,
        update_status::UpdateBatchStatus,
    },
    state::BatchStatus,
};
use anchor_lang::prelude::*;

// Cambiamos el 'pub use' por una referencia directa a las cuentas
use crate::instructions::initialize::*;

declare_id!("Fw6zjywTLYyq7DLLQkiBGHgpKteCpgbamrHbXdiJdgCg");

#[program]
pub mod food_traceability {
    use super::*;

    // Usamos el struct directamente
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handler(ctx)
    }
}

pub fn register_actor(
    ctx: Context<RegisterActor>,
    name: String,
    role: state::ActorRole,
    location: String,
) -> Result<()> {
    instructions::register_actor::handler(ctx, name, role, location)
}

pub fn create_batch(
    ctx: Context<CreateBatch>,
    id: u64,
    product: String,
    origin: String,
    quantity: u64,
) -> Result<()> {
    // Llama al handler que definimos en la carpeta de instrucciones
    instructions::create_batch::handler(ctx, id, product, origin, quantity)
}

pub fn record_event(
    ctx: Context<RecordEvent>,
    batch_id: u64,
    event_type: String,
    location: String,
    metadata: String,
) -> Result<()> {
    instructions::record_event::handler(ctx, batch_id, event_type, location, metadata)
}

pub fn update_status(
    ctx: Context<UpdateBatchStatus>,
    batch_id: u64,
    new_status: BatchStatus,
) -> Result<()> {
    instructions::update_status::handler(ctx, batch_id, new_status)
}

pub fn issue_certificate(
    ctx: Context<IssueCertificate>,
    batch_id: u64,
    cert_type: String,
    issuer: String,
    document_hash: String,
    expiry_date: i64,
) -> Result<()> {
    instructions::issue_certificate::handler(
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
    // Llamamos al handler pasándole todos los argumentos necesarios
    instructions::revoke_certificate::revoke_handler(ctx, batch_id, certificate_id, reason)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanity() {
        assert_eq!(1 + 1, 2);
        println!("✅ El entorno de Rust para el PFM está 100% operativo");
    }
}
