use crate::state::*;
use crate::BatchCreated;
use crate::FoodTraceabilityError;
use anchor_lang::prelude::*;

/// Contexto para la instrucción `create_batch`.
/// 
/// Define las cuentas necesarias para registrar un nuevo lote (Batch) en el sistema.
/// La seguridad se basa en la validación del perfil del actor y el uso de PDAs.
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

/// Manejador para la creación de un nuevo lote de producto.
/// 
/// Esta función registra la información base de un producto, captura la marca de tiempo 
/// de la red y establece el linaje (parent_sources) del lote.
/// 
/// # Argumentos
/// * `id`: Identificador único numérico (usualmente un timestamp o serie).
/// * `product`: Nombre o descripción del producto.
/// * `origin`: Ubicación o contexto de origen (ej: "Finca El Sol" o "Procesado en Planta A").
/// * `quantity`: Cantidad inicial de unidades o volumen del lote.
/// * `parent_sources`: Lista de claves públicas (Pubkeys) de otros lotes que sirvieron como insumos.
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