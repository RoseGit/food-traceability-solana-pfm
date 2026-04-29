import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from 'next/link';

interface InitializeViewProps {
  onInitialize: () => void;
  loading: boolean;
  connected: boolean;
  status: { message: string; type: 'error' | 'success' | 'info' | null };
}

export const InitializeView = ({ onInitialize, loading, connected, status }: InitializeViewProps) => (
  <div className="min-h-screen bg-[#0f1114] text-white flex flex-col font-sans">
    <nav className="border-b border-gray-800 bg-[#161b22] px-8 py-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <span className="text-xl font-bold flex items-center gap-2">
            <span className="text-green-500">◈</span> FoodTrace Admin
          </span>
        </Link>
        <span className="bg-green-500/10 text-green-500 text-[10px] uppercase tracking-widest px-2 py-1 rounded border border-green-500/20">
          Smart Contract V1
        </span>
      </div>
      <WalletMultiButton />
    </nav>

    <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
      <div className="mb-8 flex items-center gap-2 text-sm text-gray-500">
        <span>Dashboard</span>
        <span>/</span>
        <span className="text-gray-300">Configuración Inicial</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-medium">
            ⚠️ Acción Requerida: Configuración Única
          </div>
          <h1 className="text-5xl font-extrabold leading-tight">
            Inicializa el <br />
            <span className="text-green-500">Programa Maestro</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Antes de registrar actores, el contrato debe ser configurado. Establece tu wallet como la **Autoridad Administradora**.
          </p>

          <button
            onClick={onInitialize}
            disabled={loading || !connected}
            className={`w-full md:w-auto px-10 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
              loading ? 'bg-gray-700' : connected ? 'bg-green-500 hover:bg-green-400 text-black' : 'bg-red-500/20 text-red-500'
            }`}
          >
            {loading ? 'Procesando en Blockchain...' : connected ? 'Inicializar Contrato Ahora' : 'Conecta tu Wallet'}
          </button>

          {status.message && (
  <div className={`p-4 rounded-lg border text-sm ${
    status.type === 'error' 
      ? 'bg-red-500/10 border-red-500/30 text-red-400' 
      : status.type === 'success' 
        ? 'bg-green-500/10 border-green-500/30 text-green-400' 
        : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
  }`}>
    {status.message}
  </div>
)}
        </div>

        <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">🛡️ Privilegios del Administrador</h3>
          <div className="space-y-4">
            {["Gestión de Actores", "Control de Lotes", "Certificaciones", "Gobernanza"].map((item, i) => (
              <div key={i} className="flex gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors">
                <div className="text-green-500 font-bold">0{i+1}</div>
                <h4 className="font-semibold text-gray-200">{item}</h4>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  </div>
);