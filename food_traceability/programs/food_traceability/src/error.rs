use anchor_lang::prelude::*;

#[error_code]
pub enum FoodTraceabilityError {
    #[msg("No tienes permisos de administrador para realizar esta acción.")]
    NotAdmin,
    #[msg("Custom error message")]
    CustomError,
    #[msg("Solo los usuarios con el rol autorizados pueden crear lotes.")]
    OnlyAuthorizedRolesCanCreate,
    #[msg("El nombre del producto es demasiado largo.")]
    ProductTooLong,
    #[msg("El origen proporcionado es demasiado largo.")]
    OriginTooLong,
    #[msg("Solo las cuentas con rol de Autoridad pueden emitir certificados.")]
    OnlyAuthoritiesCanIssue,
    #[msg("No tienes suficiente cantidad en el lote para transferir.")]
    InsufficientQuantity,
    #[msg("Solo el destinatario especificado puede aceptar esta transferencia.")]
    NotAuthorizedRecipient,
    #[msg("La transferencia no está permitida entre estos roles según la matriz de permisos.")]
    InvalidTransferPath,
    #[msg("La transferencia ya no se encuentra en estado pendiente.")]
    InvalidStatus,
    #[msg("No autorizado.")]
    Unauthorized,
}
