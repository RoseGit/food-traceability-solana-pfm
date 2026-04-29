import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

interface RoleSelectionProps {
  onSelectRole: (role: string) => void;
  loading: boolean;
  selectedRole: string | null;
}

const ROLES = [
  { id: 'Producer', icon: '🚜', desc: 'Registra cultivos y cosecha inicial.' },
  { id: 'Factory', icon: '🏭', desc: 'Procesa materia prima y genera lotes.' },
  { id: 'Retailer', icon: '🏪', desc: 'Gestiona punto de venta y frescura.' },
  { id: 'Consumer', icon: '🥗', desc: 'Acceso a historial y validación.' }
];

export const RoleSelection = ({ onSelectRole, loading, selectedRole }: RoleSelectionProps) => (
  <div className="min-h-screen bg-[#0f1114] text-white font-sans p-8">
    <div className="max-w-6xl mx-auto">
      <header className="mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold mb-2 text-white">
            Únete a la Red <span className="text-green-500">FoodTrace</span>
          </h1>
          <p className="text-gray-400">Selecciona tu rol en la cadena de suministro.</p>
        </div>
        <WalletMultiButton />
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {ROLES.map((role) => (
          <div 
            key={role.id}
            className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 hover:border-green-500/50 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{role.icon}</div>
              <h3 className="text-xl font-bold mb-2 text-green-500">{role.id}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{role.desc}</p>
            </div>
            <button 
              onClick={() => onSelectRole(role.id)}
              disabled={loading}
              className="mt-6 w-full py-2 bg-gray-800 group-hover:bg-green-500 group-hover:text-black rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
            >
              {loading && selectedRole === role.id ? 'Solicitando...' : 'Solicitar Rol'}
            </button>
          </div>
        ))}
      </div>
    </div>
  </div>
);