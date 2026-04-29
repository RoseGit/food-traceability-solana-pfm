import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export const ActorDashboardView = ({ role }: { role: string }) => (
  <div className="min-h-screen bg-[#0f1114] text-white font-sans p-8">
    <div className="max-w-6xl mx-auto">
      <header className="mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold mb-2 text-white">
            Panel de <span className="text-blue-500 uppercase">{role}</span>
          </h1>
          <p className="text-gray-400">Gestiona tus activos en la red de FoodTrace.</p>
        </div>
        <WalletMultiButton />
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {/* CARD: CREAR TOKEN */}
        <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all group cursor-pointer">
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🪙</div>
          <h3 className="text-2xl font-bold mb-3 text-blue-500">Crear un token</h3>
          <p className="text-gray-400">Registra un nuevo lote de producto y genera su certificado digital.</p>
        </div>

        {/* CARD: VER TOKENS */}
        <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all group cursor-pointer">
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🔍</div>
          <h3 className="text-2xl font-bold mb-3 text-blue-500">Ver mis tokens</h3>
          <p className="text-gray-400">Consulta el historial y el estado actual de tus productos registrados.</p>
        </div>
      </div>
    </div>
  </div>
);