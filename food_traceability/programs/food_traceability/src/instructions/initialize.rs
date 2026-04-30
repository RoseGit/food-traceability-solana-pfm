use crate::state::ProgramConfig;
use anchor_lang::prelude::*;

/// Contexto para la instrucción `initialize`.
///
/// Esta estructura define las cuentas necesarias para configurar el estado global
/// del programa por primera vez. Utiliza una **PDA (Program Derived Address)**
/// con una semilla fija para asegurar que solo exista una única instancia de configuración.
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = ProgramConfig::SIZE,
        seeds = [b"config"], // La semilla fija para la configuración global
        bump
    )]
    pub config: Account<'info, ProgramConfig>,

    #[account(mut)]
    pub admin: Signer<'info>, // La persona que ejecuta esto será el Administrador

    pub system_program: Program<'info, System>,
}

/// Manejador de la instrucción para inicializar el sistema de trazabilidad.
///
/// Esta función establece la jerarquía de permisos y prepara la infraestructura
/// de datos inicial. Debe ejecutarse **una sola vez** tras el despliegue del contrato.
///
/// # Acciones realizadas:
/// 1. Asigna la clave pública del firmante (`admin`) como la `authority` en la configuración.
/// 2. Inicializa los contadores globales (`batch`, `event`, `certificate`) a cero.
/// 3. Almacena el `bump` de la PDA para permitir validaciones de seguridad eficientes en otras instrucciones.
///
/// # Seguridad
/// Debido a que utiliza `init` con una semilla fija, cualquier intento posterior de llamar
/// a esta instrucción fallará, protegiendo al sistema de reinicializaciones malintencionadas.
pub fn handler(ctx: Context<Initialize>) -> Result<()> {
    let config = &mut ctx.accounts.config;

    // Asignamos al firmante como la autoridad suprema del sistema
    config.authority = ctx.accounts.admin.key();

    // Inicializamos todos los contadores en cero
    config.next_batch_id = 0;
    config.next_event_id = 0;
    config.next_certificate_id = 0;

    // Guardamos el bump para futuras validaciones de la PDA
    config.bump = ctx.bumps.config;

    msg!("Sistema de Trazabilidad Alimentaria Inicializado con éxito");
    msg!("Administrador asignado: {:?}", config.authority);

    Ok(())
}
