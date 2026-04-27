use crate::events::BatchEventRecorded;
use crate::state::*;
use anchor_lang::prelude::*; // Importamos tu evento

#[derive(Accounts)]
#[instruction(batch_id: u64)]
pub struct RecordEvent<'info> {
    #[account(
        mut,
        seeds = [b"batch", batch_id.to_le_bytes().as_ref()],
        bump = batch.bump,
    )]
    pub batch: Account<'info, Batch>,

    #[account(
        seeds = [b"actor", authority.key().as_ref()],
        bump = actor_profile.bump,
        // Cualquier actor registrado puede registrar eventos (Transport, Processor, etc.)
    )]
    pub actor_profile: Account<'info, Actor>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RecordEvent>,
    batch_id: u64,
    event_type: String,
    location: String,
    _metadata: String, // Usamos guion bajo si no la guardamos en cuenta pero sí en el evento
) -> Result<()> {
    let batch = &mut ctx.accounts.batch;
    let clock = Clock::get()?;

    // 1. Incrementamos el contador de eventos en el lote
    batch.event_count += 1;

    // 2. Emitimos el evento para que el frontend lo capture
    // Usamos el contador actual como ID del evento
    emit!(BatchEventRecorded {
        event_id: batch.event_count as u64,
        batch_id: batch_id,
        event_type: event_type,
        actor: ctx.accounts.authority.key(),
        location: location,
        timestamp: clock.unix_timestamp,
    });

    msg!(
        "Evento registrado para el lote {}. Total eventos: {}",
        batch_id,
        batch.event_count
    );
    Ok(())
}
