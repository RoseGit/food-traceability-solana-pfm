use crate::state::*;
use anchor_lang::prelude::*;

/// Contexto para la instrucción `accept_transfer`.
///
/// Esta estructura define las cuentas necesarias para que un actor de la cadena
/// de suministro acepte formalmente la custodia de un lote (Batch) enviado por otro actor.
#[derive(Accounts)]
pub struct AcceptTransfer<'info> {
    /// La cuenta de solicitud de transferencia que será marcada como aceptada.
    /// Debe ser mutable para actualizar su estado interno.
    #[account(mut)]
    pub transfer_request: Account<'info, TransferRequest>,

    /// El lote de productos cuya autoridad será transferida al receptor.
    /// Debe ser mutable para cambiar el campo `authority`.
    #[account(mut)]
    pub batch: Account<'info, Batch>,

    /// La entidad que firma la transacción (el receptor de la transferencia).
    /// Se convertirá en la nueva autoridad del lote una vez aceptado.
    #[account(mut)]
    pub authority: Signer<'info>,
}

/// Manejador de la instrucción para aceptar una transferencia de custodia.
///
/// Esta función realiza dos acciones principales:
/// 1. Actualiza el estado de la cuenta `TransferRequest` a `Accepted`.
/// 2. Transfiere la propiedad del `Batch` al firmante actual, permitiéndole
///    realizar acciones futuras sobre este lote (como transformarlo o volver a transferirlo).
///
/// # Errores Comunes
/// * Si la cuenta `transfer_request` no coincide con el lote o el firmante,
///   Anchor lanzará un error de validación de cuenta.
pub fn handler(ctx: Context<AcceptTransfer>) -> Result<()> {
    let transfer = &mut ctx.accounts.transfer_request;

    // 1. Cambiamos el estado de la transferencia
    transfer.status = TransferStatus::Accepted;

    // Esto permite que el Retailer pueda realizar la siguiente transferencia
    ctx.accounts.batch.authority = ctx.accounts.authority.key();

    msg!(
        "Transferencia aceptada. Nueva autoridad del lote: {}",
        ctx.accounts.batch.authority
    );
    Ok(())
}
