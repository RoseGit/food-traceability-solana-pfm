use crate::state::*;
use crate::BatchCreated;
use crate::FoodTraceabilityError;
use anchor_lang::prelude::*; // Importamos el evento que definiste

#[derive(Accounts)]
#[instruction(id: u64, product: String, origin: String)]
pub struct CreateBatch<'info> {
    #[account(
        init,
        payer = authority,
        space = Batch::SIZE,
        // Usamos el ID único del lote como semilla para que cada lote tenga su propia PDA
        seeds = [b"batch", id.to_le_bytes().as_ref()],
        bump
    )]
    pub batch: Account<'info, Batch>,

    #[account(
        seeds = [b"actor", authority.key().as_ref()],
        bump = actor_profile.bump,
        // Validación: Solo el rol Producer puede originar lotes
        constraint = actor_profile.role == ActorRole::Producer @ FoodTraceabilityError::OnlyProducersCanCreate
    )]
    pub actor_profile: Account<'info, Actor>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateBatch>,
    id: u64,
    product: String,
    origin: String,
    quantity: u64,
) -> Result<()> {
    let batch = &mut ctx.accounts.batch;
    let clock = Clock::get()?;

    batch.id = id;
    batch.creator = ctx.accounts.authority.key();
    batch.product = product.clone();
    batch.origin = origin.clone();
    batch.quantity = quantity;
    batch.date_created = clock.unix_timestamp;
    batch.status = BatchStatus::Created;
    batch.event_count = 0; // Inicializamos contador de eventos
    batch.certificate_count = 0; // Inicializamos contador de certificados
    batch.bump = ctx.bumps.batch;

    // Disparamos el evento con tus definiciones
    emit!(BatchCreated {
        batch_id: id,
        creator: ctx.accounts.authority.key(),
        product,
        origin,
        timestamp: clock.unix_timestamp,
    });

    msg!("Lote #{} creado exitosamente por el productor", id);
    Ok(())
}
