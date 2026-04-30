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
        constraint = (actor_profile.role == ActorRole::Producer || actor_profile.role == ActorRole::Factory) 
                 @ FoodTraceabilityError::OnlyAuthorizedRolesCanCreate
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
    parent_sources: Vec<Pubkey>, // 1. Añadimos el nuevo parámetro
) -> Result<()> {
    let batch = &mut ctx.accounts.batch;
    let clock = Clock::get()?;

    // Asignación de datos al estado de la cuenta
    batch.id = id;
    batch.creator = ctx.accounts.authority.key();
    batch.product = product.clone();
    batch.origin = origin.clone();
    batch.quantity = quantity;
    batch.date_created = clock.unix_timestamp;
    batch.status = BatchStatus::Created;
    batch.event_count = 0;
    batch.certificate_count = 0;
    batch.parent_sources = parent_sources; // 2. Guardamos los insumos
    batch.bump = ctx.bumps.batch;

    // 3. Mantenemos el disparo del evento (puedes añadir parent_sources al evento si quieres)
    emit!(BatchCreated {
        batch_id: id,
        creator: ctx.accounts.authority.key(),
        product,
        origin,
        timestamp: clock.unix_timestamp,
    });

    msg!(
        "Lote #{} creado exitosamente con {} fuentes de origen",
        id,
        batch.parent_sources.len()
    );

    Ok(())
}
