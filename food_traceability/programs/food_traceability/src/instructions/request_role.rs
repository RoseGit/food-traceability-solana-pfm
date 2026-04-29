use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(name: String, role: ActorRole)]
pub struct RequestRole<'info> {
    #[account(
        init,
        payer = user,
        space = RoleRequest::SIZE,
        seeds = [b"request", user.key().as_ref()],
        bump
    )]
    pub role_request: Account<'info, RoleRequest>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RequestRole>,
    name: String,
    role: ActorRole,
    location: String,
) -> Result<()> {
    let request = &mut ctx.accounts.role_request;

    request.user = ctx.accounts.user.key();
    request.requested_role = role;

    // Usamos .clone() aquí para que 'name' siga disponible después
    request.name = name.clone();
    request.location = location; // Aquí se mueve 'location', pero no la usas después

    request.status = RequestStatus::Pending;
    request.bump = ctx.bumps.role_request;

    msg!(
        "Solicitud de rol {:?} creada para {}",
        request.requested_role,
        name // Ahora sí puedes usar name porque arriba pasaste un clon
    );

    Ok(())
}
