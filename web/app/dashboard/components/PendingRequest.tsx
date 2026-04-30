/**
 * Pantalla de Estado de Solicitud Pendiente.
 * 
 * Se muestra tras una solicitud de rol exitosa en la blockchain, informando al usuario
 * que su perfil está en espera de validación por parte de un administrador.
 * 
 * @component
 * @param {PendingRequestProps} props - Propiedades del componente.
 * @param {string | null} props.selectedRole - El nombre del rol que el usuario solicitó (ej. Producer, Factory).
 * @param {Function} props.onBack - Callback para resetear el estado de la vista y volver al menú principal.
 * 
 * @description
 * - Presenta una animación de carga (spinner) para denotar que el proceso sigue "activo" administrativamente.
 * - Sirve como barrera de acceso hasta que el estado del `actorProfile` cambie en el Smart Contract.
 */
interface PendingRequestProps {
  selectedRole: string | null;
  onBack: () => void;
}

export const PendingRequest = ({ selectedRole, onBack }: PendingRequestProps) => (
  <div className="min-h-screen bg-[#0f1114] text-white flex flex-col items-center justify-center p-6 text-center">
    <div className="w-20 h-20 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-8"></div>
    <h2 className="text-3xl font-bold mb-4">Solicitud Enviada</h2>
    <p className="text-gray-400 max-w-md">
      Tu solicitud para ser <strong>{selectedRole}</strong> ha sido registrada.
      Espera la aprobación del Administrador.
    </p>
    <button onClick={onBack} className="mt-8 text-sm text-gray-500 hover:text-white">
      Volver a inicio
    </button>
  </div>
);