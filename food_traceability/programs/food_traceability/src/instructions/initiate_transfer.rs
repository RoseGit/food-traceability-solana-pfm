use crate::state::*;
use anchor_lang::prelude::*;
use crate::error::FoodTraceabilityError;

#[derive(Accounts)]
#[instruction(quantity: u64, seed_nonce: u64)]
pub struct InitiateTransfer<'info> {
    #[account(
        init, 
        payer = authority, 
        space = TransferRequest::SIZE, 
        // Añadimos seed_nonce a las semillas
        seeds = [
            b"transfer", 
            authority.key().as_ref(), 
            batch.key().as_ref(),
            seed_nonce.to_le_bytes().as_ref() 
        ], 
        bump
    )]

    pub transfer_request: Account<'info, TransferRequest>,

    #[account(mut, constraint = batch.creator == authority.key())]
    pub batch: Account<'info, Batch>,

    // Perfil del que ENVÍA (Sender)
    #[account(seeds = [b"actor", authority.key().as_ref()], bump = sender_profile.bump)]
    pub sender_profile: Account<'info, Actor>,

    // Perfil del que RECIBE (Recipient)
    #[account(seeds = [b"actor", recipient_wallet.key().as_ref()], bump = recipient_profile.bump)]
    pub recipient_profile: Account<'info, Actor>,

    /// CHECK: Solo para obtener la llave del receptor
    pub recipient_wallet: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitiateTransfer>, quantity: u64, _seed_nonce: u64) -> Result<()> {
    // 1. Validar que tiene cantidad suficiente
    require!(
        ctx.accounts.batch.quantity >= quantity,
        FoodTraceabilityError::InsufficientQuantity
    );

    let sender_role = &ctx.accounts.sender_profile.role;
    let recipient_role = &ctx.accounts.recipient_profile.role;
    
    // 2. Validación de la Matriz de Permisos (Impecable)
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

    msg!(
        "Transferencia de {} unidades iniciada hacia {}",
        quantity,
        ctx.accounts.recipient_wallet.key()
    );
    Ok(())
}