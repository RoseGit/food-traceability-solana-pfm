use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(name: String, role: ActorRole, location: String)]
pub struct RegisterActor<'info> {
    #[account(
        init,
        payer = authority,
        space = Actor::SIZE,
        // La semilla vincula la cuenta del actor directamente a su billetera
        seeds = [b"actor", authority.key().as_ref()], 
        bump
    )]
    pub actor_account: Account<'info, Actor>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RegisterActor>,
    name: String,
    role: ActorRole,
    location: String,
) -> Result<()> {
    let actor = &mut ctx.accounts.actor_account;

    actor.address = ctx.accounts.authority.key();
    actor.name = name;
    actor.role = role;
    actor.location = location;
    actor.is_active = true;
    actor.bump = ctx.bumps.actor_account;

    msg!("Actor registrado exitosamente: {}", actor.name);
    msg!("Rol asignado: {:?}", actor.role);

    Ok(())
}
