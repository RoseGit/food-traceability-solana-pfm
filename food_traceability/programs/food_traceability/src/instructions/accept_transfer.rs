use crate::error::FoodTraceabilityError;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct AcceptTransfer<'info> {
    #[account(
        mut,
        has_one = to @ FoodTraceabilityError::NotAuthorizedRecipient,
        constraint = transfer_request.status == TransferStatus::Pending
    )]
    pub transfer_request: Account<'info, TransferRequest>,

    #[account(mut)]
    pub batch: Account<'info, Batch>,

    pub to: Signer<'info>, // La Factory que firma
}

pub fn handler(ctx: Context<AcceptTransfer>) -> Result<()> {
    let transfer = &mut ctx.accounts.transfer_request;
    let batch = &mut ctx.accounts.batch;

    // 1. Restar la cantidad del lote original
    batch.quantity -= transfer.quantity;

    // 2. Cambiar estado
    transfer.status = TransferStatus::Accepted;

    msg!(
        "Transferencia aceptada. El lote original ahora tiene {} unidades",
        batch.quantity
    );
    Ok(())
}
