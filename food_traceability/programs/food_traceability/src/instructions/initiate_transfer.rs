use crate::state::*;
use anchor_lang::prelude::*;
use crate::error::FoodTraceabilityError;

/// Contexto para la instrucción `initiate_transfer`.
/// 
/// Esta estructura gestiona la creación de una solicitud de transferencia de custodia.
/// Utiliza un sistema de seguridad de triple validación: autoridad sobre el lote, 
/// existencia de perfiles de actor y lógica de negocio de la cadena de suministro.
#[derive(Accounts)]
#[instruction(quantity: u64, seed_nonce: u64)]
pub struct InitiateTransfer<'info> {
    #[account(
        init, 
        payer = authority, 
        space = TransferRequest::SIZE, 
        seeds = [
            b"transfer", 
            authority.key().as_ref(), 
            batch.key().as_ref(),
            seed_nonce.to_le_bytes().as_ref() 
        ], 
        bump
    )]
    pub transfer_request: Account<'info, TransferRequest>,

    
    #[account(mut, constraint = batch.authority == authority.key() @ FoodTraceabilityError::Unauthorized)]
    pub batch: Account<'info, Batch>,

    #[account(seeds = [b"actor", authority.key().as_ref()], bump = sender_profile.bump)]
    pub sender_profile: Account<'info, Actor>,

    #[account(seeds = [b"actor", recipient_wallet.key().as_ref()], bump = recipient_profile.bump)]
    pub recipient_profile: Account<'info, Actor>,

    
    pub recipient_wallet: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Manejador para iniciar una transferencia de custodia entre actores.
/// 
/// La función ejecuta la "Matriz de Permisos" del sistema, asegurando que la trazabilidad 
/// sea coherente con el mundo real.
/// 
/// # Lógica de Negocio:
/// 1. **Validación de Inventario**: Comprueba que el lote tenga suficiente `quantity`.
/// 2. **Matriz de Permisos**: Verifica que el flujo de roles sea legal:
///    - `Producer` -> `Factory`
///    - `Factory` -> `Retailer`
///    - `Retailer` -> `Consumer`
/// 3. **Estado Pendiente**: La transferencia se crea con estado `Pending`. La custodia 
///    no cambia legalmente hasta que el receptor la acepta.
pub fn handler(ctx: Context<InitiateTransfer>, quantity: u64, _seed_nonce: u64) -> Result<()> {
    // 1. Validar cantidad
    require!(
        ctx.accounts.batch.quantity >= quantity,
        FoodTraceabilityError::InsufficientQuantity
    );

    let sender_role = &ctx.accounts.sender_profile.role;
    let recipient_role = &ctx.accounts.recipient_profile.role;
    
    // 2. Matriz de Permisos
    let is_valid = match (sender_role, recipient_role) {
        (ActorRole::Producer, ActorRole::Factory) => true,
        (ActorRole::Factory, ActorRole::Retailer) => true,
        (ActorRole::Retailer, ActorRole::Consumer) => true,
        _ => false,
    };

    require!(is_valid, FoodTraceabilityError::InvalidTransferPath);

    // 3. Asignación de datos
    let transfer = &mut ctx.accounts.transfer_request;
    transfer.batch_id = ctx.accounts.batch.id;
    transfer.from = ctx.accounts.authority.key();
    transfer.to = ctx.accounts.recipient_wallet.key();
    transfer.quantity = quantity;
    transfer.status = TransferStatus::Pending;
    transfer.bump = ctx.bumps.transfer_request;

    Ok(())
}