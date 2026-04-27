use anchor_lang::prelude::*;

#[error_code]
pub enum FoodTraceabilityError {
    #[msg("Custom error message")]
    CustomError,
    #[msg("Solo los usuarios con el rol de Productor pueden crear lotes.")]
    OnlyProducersCanCreate,
    #[msg("El nombre del producto es demasiado largo.")]
    ProductTooLong,
    #[msg("El origen proporcionado es demasiado largo.")]
    OriginTooLong,
    #[msg("Solo las cuentas con rol de Autoridad pueden emitir certificados.")]
    OnlyAuthoritiesCanIssue,
}
