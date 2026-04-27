use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::FoodTraceabilityError;
use crate::events::CertificateIssued;

#[derive(Accounts)]
#[instruction(batch_id: u64, certificate_type: String)]
pub struct IssueCertificate<'info> {
    #[account(
        init,
        payer = authority,
        space = Certificate::SIZE,
        // Semilla basada en batch_id y el contador de certificados del lote
        seeds = [
            b"certificate", 
            batch_id.to_le_bytes().as_ref(), 
            batch.certificate_count.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub certificate: Account<'info, Certificate>,

    #[account(
        mut,
        seeds = [b"batch", batch_id.to_le_bytes().as_ref()],
        bump = batch.bump,
    )]
    pub batch: Account<'info, Batch>,

    #[account(
        seeds = [b"actor", authority.key().as_ref()],
        bump = actor_profile.bump,
        constraint = actor_profile.role == ActorRole::Authority @ FoodTraceabilityError::OnlyAuthoritiesCanIssue
    )]
    pub actor_profile: Account<'info, Actor>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<IssueCertificate>,
    batch_id: u64,
    certificate_type: String,
    issuer: String,
    document_hash: String,
    expiry_date: i64,
) -> Result<()> {
    let certificate = &mut ctx.accounts.certificate;
    let batch = &mut ctx.accounts.batch;
    let clock = Clock::get()?;

    // Asignación siguiendo tu estructura original
    certificate.id = batch.certificate_count as u64; // El ID es el índice actual
    certificate.batch_id = batch_id;
    certificate.certificate_type = certificate_type.clone();
    certificate.issuer = issuer.clone();
    certificate.document_hash = document_hash;
    certificate.issued_date = clock.unix_timestamp;
    certificate.expiry_date = expiry_date;
    certificate.status = CertificateStatus::Valid; // Estado inicial
    certificate.bump = ctx.bumps.certificate;

    // Incrementamos el contador en el lote principal
    batch.certificate_count += 1;

    // Emitimos el evento CertificateIssued con tus campos
    emit!(CertificateIssued {
        certificate_id: certificate.id,
        batch_id,
        certificate_type,
        issuer,
        timestamp: clock.unix_timestamp,
    });

    msg!("Certificado #{} emitido para el lote {}", certificate.id, batch_id);
    Ok(())
}