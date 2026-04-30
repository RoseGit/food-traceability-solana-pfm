use crate::error::FoodTraceabilityError;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct RejectTransfer<'info> {
    #[account(
        mut,
        // Validamos que el que firma sea el destinatario 'to' guardado en la solicitud
        has_one = to @ FoodTraceabilityError::NotAuthorizedRecipient,
        // Solo se puede rechazar si aún está pendiente
        constraint = transfer_request.status == TransferStatus::Pending @ FoodTraceabilityError::InvalidStatus
    )]
    pub transfer_request: Account<'info, TransferRequest>,

    pub to: Signer<'info>,
}

pub fn handler(ctx: Context<RejectTransfer>) -> Result<()> {
    let transfer = &mut ctx.accounts.transfer_request;

    // Cambiamos el estado a Rechazado
    transfer.status = TransferStatus::Rejected;

    msg!(
        "La transferencia del lote ID {} ha sido rechazada por el destinatario.",
        transfer.batch_id
    );

    Ok(())
}
