import { useState, useEffect } from 'react';
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";

export const AdminDashboardView = ({ program }: { program: any }) => {
  const { publicKey } = useWallet();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Función para obtener solicitudes pendientes
  const fetchRequests = async () => {
    if (!program) return;
    try {
      setLoading(true);
      // Buscamos todas las cuentas de tipo 'roleRequest' en la blockchain
      const allRequests = await program.account.roleRequest.all();
      
      // Filtramos solo las que están en estado "Pending"
      const pending = allRequests.filter((req: any) => 
        req.account.status.pending !== undefined
      );
      
      setRequests(pending);
    } catch (error) {
      console.error("Error al cargar solicitudes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [program]);

  // Función para aprobar un actor
  const handleApprove = async (requestPubKey: PublicKey, userPubKey: PublicKey) => {
    if (!program || !publicKey) return;

    try {
      setLoading(true);
      
      // Derivamos las PDAs necesarias
      const [configPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );

      const [actorPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("actor"), userPubKey.toBuffer()],
        program.programId
      );

      // Llamada al método 'approveActor' del contrato
      await program.methods
        .approveActor()
        .accounts({
          actorAccount: actorPDA,
          roleRequest: requestPubKey,
          admin: publicKey,
          config: configPDA,
        })
        .rpc();

      alert("¡Actor aprobado y registrado exitosamente!");
      fetchRequests(); // Recargamos la lista
    } catch (error: any) {
      console.error("Error en la aprobación:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
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

        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CARD: LISTADO DE SOLICITUDES */}
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 hover:border-green-500/30 transition-all">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-green-500 flex items-center gap-3">
                🛡️ Validar Roles
              </h3>
              <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-sm font-bold">
                {requests.length} Pendientes
              </span>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {requests.length === 0 ? (
                <p className="text-gray-500 italic text-center py-10">No hay solicitudes nuevas por ahora.</p>
              ) : (
                requests.map((req) => (
                  <div key={req.publicKey.toBase58()} className="bg-[#0d1117] border border-gray-800 p-5 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-lg text-white">{req.account.name}</h4>
                      <p className="text-sm text-gray-500 font-mono mb-1">{req.account.user.toBase58().slice(0, 8)}...</p>
                      <span className="text-xs font-bold uppercase px-2 py-1 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                        {Object.keys(req.account.requestedRole)[0]}
                      </span>
                    </div>
                    <button 
                      disabled={loading}
                      onClick={() => handleApprove(req.publicKey, req.account.user)}
                      className="bg-green-500 hover:bg-green-400 text-black px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
                    >
                      {loading ? "..." : "Aprobar"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CARD SECUNDARIA (EJEMPLO) */}
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 opacity-50 cursor-not-allowed">
             <h3 className="text-2xl font-bold mb-3 text-gray-400">Estadísticas del Sistema</h3>
             <p className="text-gray-500 italic text-sm">Próximamente: Visualiza el flujo de trazabilidad global.</p>
          </div>
        </div>
      </div>
    </div>
  );
};