use crate::events::BatchStatusChanged;
use crate::state::*;
use anchor_lang::prelude::*; // Importamos tu evento

#[derive(Accounts)]
#[instruction(batch_id: u64)]
pub struct UpdateBatchStatus<'info> {
    #[account(
        mut,
        seeds = [b"batch", batch_id.to_le_bytes().as_ref()],
        bump = batch.bump,
    )]
    pub batch: Account<'info, Batch>,

    #[account(
        seeds = [b"actor", authority.key().as_ref()],
        bump = actor_profile.bump,
        // Aquí podrías añadir restricciones más específicas, 
        // ej: que solo el creador o un transportista pueda cambiarlo
    )]
    pub actor_profile: Account<'info, Actor>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<UpdateBatchStatus>,
    batch_id: u64,
    new_status: BatchStatus,
) -> Result<()> {
    let batch = &mut ctx.accounts.batch;
    let clock = Clock::get()?;

    // Actualizamos el estado en la cuenta
    batch.status = new_status.clone();

    // Disparamos el evento de cambio de estado
    emit!(BatchStatusChanged {
        batch_id,
        new_status,
        timestamp: clock.unix_timestamp,
    });

    msg!("Estado del lote {} actualizado correctamente", batch_id);
    Ok(())
}
