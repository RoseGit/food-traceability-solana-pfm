import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from 'next/link';

export const AdminDashboardView = () => (
  <div className="min-h-screen bg-[#0f1114] text-white font-sans p-8">
    <div className="max-w-6xl mx-auto">
      <header className="mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold mb-2 text-white">
            Panel de <span className="text-green-500">Administración</span>
          </h1>
          <p className="text-gray-400">Gestiona los permisos y la gobernanza de FoodTrace.</p>
        </div>
        <WalletMultiButton />
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* CARD: VALIDAR ROLES */}
        <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 hover:border-green-500/50 transition-all group flex flex-col justify-between">
          <div>
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🛡️</div>
            <h3 className="text-2xl font-bold mb-3 text-green-500">Validar Roles</h3>
            <p className="text-gray-400 leading-relaxed">
              En esta pantalla podrás revisar, aprobar o rechazar las solicitudes de los actores 
              (Productores, Fábricas, etc.) que desean unirse al sistema de trazabilidad.
            </p>
          </div>
          
          <button className="mt-8 w-full py-3 bg-green-500 text-black rounded-xl font-bold hover:bg-green-400 transition-colors">
            Ver Solicitudes
          </button>
        </div>

        {/* Puedes añadir más cards en el futuro, como "Estadísticas" o "Configuración" */}
      </div>
    </div>
  </div>
);