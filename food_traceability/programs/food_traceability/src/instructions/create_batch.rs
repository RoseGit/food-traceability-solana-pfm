use crate::state::*;
use crate::BatchCreated;
use crate::FoodTraceabilityError;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(id: u64, product: String, origin: String)]
pub struct CreateBatch<'info> {
    #[account(
        init,
        payer = authority,
        space = Batch::SIZE,
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
    parent_sources: Vec<Pubkey>,
) -> Result<()> {
    let batch = &mut ctx.accounts.batch;
    let clock = Clock::get()?;

    // Asignación de datos al estado de la cuenta
    batch.id = id;
    batch.creator = ctx.accounts.authority.key();
    
    // --- CAMBIO CRÍTICO: Inicializamos la autoridad con la cuenta que crea el lote ---
    batch.authority = ctx.accounts.authority.key(); 
    
    batch.product = product.clone();
    batch.origin = origin.clone();
    batch.quantity = quantity;
    batch.date_created = clock.unix_timestamp;
    batch.status = BatchStatus::Created;
    batch.event_count = 0;
    batch.certificate_count = 0;
    batch.parent_sources = parent_sources;
    batch.bump = ctx.bumps.batch;

    // Emisión del evento
    emit!(BatchCreated {
        batch_id: id,
        creator: ctx.accounts.authority.key(),
        product,
        origin,
        timestamp: clock.unix_timestamp,
    });

    msg!(
        "Lote #{} creado exitosamente. Autoridad inicial: {}",
        id,
        batch.authority
    );

    Ok(())
}