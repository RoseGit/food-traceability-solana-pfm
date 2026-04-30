use anchor_lang::prelude::*;

use crate::error::FoodTraceabilityError;

// Definición de enums
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum BatchStatus {
    Created,
    InProcessing,
    InTransit,
    QualityCheck,
    Exported,
    Delivered,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub enum ActorRole {
    Producer,    
    Factory, 
    Retailer,
    Consumer,
    Authority
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum CertificateStatus {
    Valid,
    Expired,
    Revoked,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum RequestStatus {
    Pending,
    Approved,
    Rejected,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum TransferStatus {
    Pending,
    Accepted,
    Rejected,
}

#[account]
pub struct TransferRequest {
    pub batch_id: u64,
    pub from: Pubkey,      // Productor
    pub to: Pubkey,        // Factory
    pub quantity: u64,
    pub status: TransferStatus,
    pub bump: u8,
}

#[account]
pub struct RoleRequest {
    pub user: Pubkey,              // Quién solicita
    pub requested_role: ActorRole, // Qué rol quiere
    pub name: String,
    pub location: String,
    pub status: RequestStatus, // Pendiente, Aprobado, Rechazado
    pub bump: u8,
}

impl TransferRequest {
    pub const SIZE: usize = 8 + 8 + 32 + 32 + 8 + 1 + 1; // Discriminador + campos
}

#[derive(Accounts)]
pub struct RejectRole<'info> {
    #[account(
        mut,
        // Usamos el nombre exacto de tu enum de errores
        constraint = config.authority == admin.key() @ FoodTraceabilityError::NotAdmin,
        close = admin 
    )]
    pub role_request: Account<'info, RoleRequest>,

    pub admin: Signer<'info>,

    #[account(seeds = [b"config"], bump)]
    pub config: Account<'info, ProgramConfig>,
}

impl RoleRequest {
    pub const SIZE: usize = 8 + 32 + (1 + 1) + 4 + 50 + 4 + 50 + 1 + 1;
}

// Struct principal: Lote
#[account]
pub struct Batch {
    pub id: u64,                // ID único del lote
    pub creator: Pubkey,        // Productor que creó el lote
    pub authority: Pubkey,
    pub product: String,        // "Café Arábica", "Cacao", etc. (max 64 chars)
    pub origin: String,         // Finca/ubicación de origen (max 128 chars)
    pub quantity: u64,          // Cantidad en kg o unidades    
    pub date_created: i64,      // Timestamp Unix
    pub status: BatchStatus,    // Estado actual
    pub event_count: u32,       // Número de eventos registrados
    pub certificate_count: u32, // Número de certificados
    pub bump: u8,               // Bump para PDA derivation
    pub parent_sources: Vec<Pubkey>,
}

impl Batch {
    // Ejemplo: Si antes tenías 200, súmale 32
    pub const SIZE: usize = 8 + 8 + 32 + 32 + (4 + 50) + (4 + 50) + 8; 
}

// Evento del lote
#[account]
pub struct BatchEvent {
    pub id: u64,            // ID único del evento
    pub batch_id: u64,      // A qué lote pertenece
    pub event_type: String, // "Cosecha", "Secado", "Transporte", etc.
    pub actor: Pubkey,      // Quién registró el evento
    pub location: String,   // Ubicación (max 256 chars)
    pub timestamp: i64,     // Timestamp Unix
    pub metadata: String,   // JSON con detalles (max 1024 chars)
    pub bump: u8,
}

// Certificado
#[account]
pub struct Certificate {
    pub id: u64,                   // ID único del certificado
    pub batch_id: u64,             // Lote al que pertenece
    pub certificate_type: String,  // "Sanitario", "Calidad", "Origen"
    pub issuer: String,            // Entidad que emite (max 128 chars)
    pub document_hash: String,     // Hash IPFS o SHA256 del PDF
    pub issued_date: i64,          // Timestamp Unix
    pub expiry_date: i64,          // Timestamp Unix (0 si no expira)
    pub status: CertificateStatus, // Estado actual
    pub bump: u8,
}

impl Certificate {
    pub const SIZE: usize = 8  // Discriminator
        + 8                    // id (u64)
        + 8                    // batch_id (u64)
        + (4 + 64)             // certificate_type (String max 64)
        + (4 + 128)            // issuer (String max 128)
        + (4 + 64)             // document_hash (String max 64)
        + 8                    // issued_date (i64)
        + 8                    // expiry_date (i64)
        + 1                    // status (Enum ocupa 1 byte)
        + 1; // bump (u8)
}

// Registro de Actor
#[account]
pub struct Actor {
    pub address: Pubkey,  // Dirección Solana
    pub name: String,     // Nombre de la entidad (max 128 chars)
    pub role: ActorRole,  // Rol en la cadena
    pub location: String, // Ubicación (ciudad, país, etc.)
    pub is_active: bool,  // Si está activo
    pub created_at: i64,  // Timestamp Unix
    pub bump: u8,
}

// Configuración global del programa
#[account]
pub struct ProgramConfig {
    pub authority: Pubkey,        // Admin del sistema
    pub next_batch_id: u64,       // Contador para IDs de lotes
    pub next_event_id: u64,       // Contador para IDs de eventos
    pub next_certificate_id: u64, // Contador para IDs de certificados
    pub bump: u8,
}

impl ProgramConfig {
    pub const SIZE: usize = 8  // Discriminador de Anchor (obligatorio)
        + 32                   // authority (Pubkey)
        + 8                    // next_batch_id (u64)
        + 8                    // next_event_id (u64)
        + 8                    // next_certificate_id (u64)
        + 1; // bump (u8)
}

impl Actor {
    // Cálculo de espacio: 8 (discriminador) + 32 + (4 + 40) + 1 + (4 + 40) + 1 + 1 = 131
    pub const SIZE: usize = 8 + 32 + 44 + 1 + 44 + 1 + 1;
}
