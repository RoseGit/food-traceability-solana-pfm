use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct AcceptTransfer<'info> {
    #[account(mut)]
    pub transfer_request: Account<'info, TransferRequest>,

    #[account(mut)]
    pub batch: Account<'info, Batch>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<AcceptTransfer>) -> Result<()> {
    let transfer = &mut ctx.accounts.transfer_request;

    // 1. Cambiamos el estado de la transferencia
    transfer.status = TransferStatus::Accepted;

    // 2. ACTUALIZACIÓN CRÍTICA: El receptor ahora es la autoridad del lote
    // Esto permite que el Retailer pueda realizar la siguiente transferencia
    ctx.accounts.batch.authority = ctx.accounts.authority.key();

    msg!(
        "Transferencia aceptada. Nueva autoridad del lote: {}",
        ctx.accounts.batch.authority
    );
    Ok(())
}
