// instructions/approve_actor.rs
use crate::state::*;
use anchor_lang::prelude::*;

/// Contexto para la instrucción `approve_actor`.
///
/// Esta estructura define el proceso de transición de una solicitud pendiente (`RoleRequest`)
/// a un perfil de usuario activo (`Actor`) dentro del sistema de trazabilidad.
#[derive(Accounts)]
pub struct ApproveActor<'info> {
    // La cuenta del actor que se va a crear oficialmente
    #[account(
        init,
        payer = admin,
        space = Actor::SIZE,
        seeds = [b"actor", role_request.user.as_ref()],
        bump
    )]
    pub actor_account: Account<'info, Actor>,

    // La solicitud que vamos a procesar y cerrar
    #[account(
        mut,
        seeds = [b"request", role_request.user.as_ref()],
        bump = role_request.bump,
        close = admin // El admin recupera los SOL de la renta al cerrar la solicitud
    )]
    pub role_request: Account<'info, RoleRequest>,

    #[account(mut)]
    pub admin: Signer<'info>,

    // Validamos que sea el administrador oficial del sistema
    #[account(
        constraint = config.authority == admin.key()
    )]
    pub config: Account<'info, ProgramConfig>,

    pub system_program: Program<'info, System>,
}

/// Manejador para aprobar y registrar formalmente a un participante en la red.
///
/// Transfiere los datos verificados desde la solicitud (`RoleRequest`) hacia la nueva
/// cuenta de estado permanente (`Actor`), activando sus permisos de operación.
///
/// # Pasos:
/// 1. Mapea la dirección de la wallet, el nombre y el rol solicitado.
/// 2. Establece el flag `is_active` en `true`.
/// 3. Almacena el `bump` para futuras validaciones de la PDA.
pub fn handler(ctx: Context<ApproveActor>) -> Result<()> {
    let actor = &mut ctx.accounts.actor_account;
    let request = &ctx.accounts.role_request;

    actor.address = request.user;
    actor.name = request.name.clone();
    actor.role = request.requested_role.clone();
    actor.location = request.location.clone();
    actor.is_active = true;
    actor.bump = ctx.bumps.actor_account;

    msg!("Actor aprobado y registrado: {}", actor.name);
    Ok(())
}
