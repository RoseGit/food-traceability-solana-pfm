use crate::error::FoodTraceabilityError;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(batch_id: u64, certificate_id: u64)]
pub struct RevokeCertificate<'info> {
    #[account(
        mut,
        seeds = [b"certificate", batch_id.to_le_bytes().as_ref(), certificate_id.to_le_bytes().as_ref()],
        bump = certificate.bump,
    )]
    pub certificate: Account<'info, Certificate>,

    #[account(
        seeds = [b"actor", authority.key().as_ref()],
        bump = actor_profile.bump,
        constraint = actor_profile.role == ActorRole::Authority @ FoodTraceabilityError::OnlyAuthoritiesCanIssue
    )]
    pub actor_profile: Account<'info, Actor>,

    pub authority: Signer<'info>,
}

pub fn revoke_handler(
    ctx: Context<RevokeCertificate>,
    _batch_id: u64,
    _certificate_id: u64,
    reason: String,
) -> Result<()> {
    let certificate = &mut ctx.accounts.certificate;

    certificate.status = CertificateStatus::Revoked;

    emit!(crate::events::CertificateRevoked {
        certificate_id: certificate.id,
        reason,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
