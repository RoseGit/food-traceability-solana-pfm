use crate::state::ProgramConfig;
use anchor_lang::prelude::*;

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
