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