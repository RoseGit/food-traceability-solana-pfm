'use client';

import { useState, useEffect } from 'react';
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "../../hooks/useProgram"; 
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const [lastPublicKey, setLastPublicKey] = useState<string | null>(null);
  const { program } = useProgram();

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [requestPending, setRequestPending] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'error' | 'success' | 'info' | null }>({
    message: '',
    type: null
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const currentKey = publicKey?.toBase58() || null;

    if (lastPublicKey && currentKey && currentKey !== lastPublicKey) {
      router.push('/');
      return;
    }

    if (lastPublicKey && !currentKey) {
      router.push('/');
      return;
    }

    if (currentKey !== lastPublicKey) {
      setLastPublicKey(currentKey);
    }
  }, [publicKey, mounted, router, lastPublicKey]);

  const handleInitialize = async () => {
    if (!program || !publicKey) return;
    try {
      setLoading(true);
      setStatus({ message: 'Iniciando transacción...', type: 'info' });
      const tx = await program.methods.initialize().accounts({}).rpc();
      setStatus({ message: `¡Éxito! ID: ${tx.slice(0, 8)}`, type: 'success' });
    } catch (error: any) {
      setStatus({ message: `Error: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRole = async (role: string) => {
    if (!program || !publicKey) {
      alert("Por favor, conecta tu wallet primero");
      return;
    }

    try {
      setLoading(true);
      setSelectedRole(role);

      // Mapeamos el string al formato que espera tu Smart Contract (state::ActorRole)
      // Nota: Si en Rust es un Enum, Anchor suele esperar un objeto { producer: {} } o similar
      const roleParam = { [role.toLowerCase()]: {} }; 

      const tx = await program.methods
        .registerActor(
          "Usuario Nuevo", // Nombre (puedes poner un prompt o un input luego)
          roleParam,       // El Enum del Rol
          "Ubicación pendiente" // Localización
        )
        .accounts({
          // Revisa tu struct 'RegisterActor' en instructions/register_actor.rs
          // Probablemente necesite:
          // actor: publicKey,
          // authority: publicKey,
          // systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Transacción exitosa:", tx);
      setRequestPending(true);

    } catch (error: any) {
      console.error("Error al registrar:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
};

useEffect(() => {
  const checkExistingRole = async () => {
    if (!program || !publicKey) return;

    try {
      // Intentamos buscar la cuenta del actor para esta llave pública
      // Nota: 'actorAccount' debe coincidir con el nombre en tu state.rs
      const [actorPDA] = Array.from(await program.account.actor.all([
        {
          memcmp: {
            offset: 8, // Offset típico de Anchor para el discriminador
            bytes: publicKey.toBase58(),
          },
        },
      ]));

      if (actorPDA) {
        console.log("Rol detectado:", actorPDA.account.role);
        // Si ya existe, saltamos la selección y vamos al dashboard real
        setRequestPending(false); 
        // Aquí podrías setear el rol en un estado para mostrar el panel correcto
      }
    } catch (e) {
      console.log("No se encontró rol previo, mostrando selección.");
    }
  };

  if (mounted && connected) {
    checkExistingRole();
  }
}, [mounted, connected, publicKey, program]);

  if (!mounted) return null;

  // VISTA: SOLICITUD PENDIENTE
  if (requestPending) {
    return (
      <div className="min-h-screen bg-[#0f1114] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-8"></div>
        <h2 className="text-3xl font-bold mb-4">Solicitud Enviada</h2>
        <p className="text-gray-400 max-w-md">
          Tu solicitud para ser <strong>{selectedRole}</strong> ha sido registrada. 
          Espera la aprobación del Administrador.
        </p>
        <button onClick={() => setRequestPending(false)} className="mt-8 text-sm text-gray-500 hover:text-white">
          Volver a la selección
        </button>
      </div>
    );
  }

  // VISTA: SELECCIÓN DE ROLES
  return (
    <div className="min-h-screen bg-[#0f1114] text-white font-sans p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-extrabold mb-2">Únete a la Red <span className="text-green-500">FoodTrace</span></h1>
            <p className="text-gray-400">Selecciona tu rol en la cadena de suministro.</p>
          </div>
          <WalletMultiButton />
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { id: 'Producer', icon: '🚜', desc: 'Registra cultivos y cosecha inicial.' },
            { id: 'Factory', icon: '🏭', desc: 'Procesa materia prima y genera lotes.' },
            { id: 'Retailer', icon: '🏪', desc: 'Gestiona punto de venta y frescura.' },
            { id: 'Consumer', icon: '🥗', desc: 'Acceso a historial y validación.' }
          ].map((role) => (
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
                onClick={() => handleRequestRole(role.id)}
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
} // <--- ESTA ES LA LLAVE QUE TE FALTABA