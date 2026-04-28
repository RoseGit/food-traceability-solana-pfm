'use client';

import { useState, useEffect } from 'react';
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { connected } = useWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#0f1114] text-white">
      {/* --- ENCABEZADO (NAVBAR) --- */}
      <header className="w-full px-8 py-4 flex justify-between items-center border-b border-gray-800 bg-[#161b22]">
        <div className="flex items-center gap-2">
          {/* Icono representativo (puedes cambiarlo por un logo) */}
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center font-bold text-black">
            F
          </div>
          <span className="text-xl font-bold tracking-tight">
            FoodTrace <span className="text-green-500 text-sm font-normal">Solana</span>
          </span>
        </div>

        <div className="flex items-center">
          <WalletMultiButton />
        </div>
      </header>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
            Trazabilidad Alimentaria <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
              Descentralizada & Segura
            </span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl leading-relaxed">
            Plataforma basada en **Solana** diseñada para garantizar la transparencia en la cadena 
            de suministro. Registra cada paso del camino, desde el productor hasta tu mesa, 
            usando contratos inteligentes para asegurar que la información sea inmutable y confiable.
          </p>

          <div className="pt-8">
            <button
              onClick={() => alert("Próximamente: Redirigiendo al Dashboard...")}
              className="px-10 py-4 bg-white text-black font-bold rounded-full hover:bg-green-500 hover:text-white transition-all transform hover:scale-105 shadow-lg shadow-green-500/20"
            >
              Go to Dashboard →
            </button>
          </div>
        </div>

        {/* --- INDICADOR DE ESTADO --- */}
        <div className="mt-12 flex items-center gap-2 text-sm text-gray-500 bg-gray-900/50 px-4 py-2 rounded-full border border-gray-800">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          {connected ? 'Wallet Conectada' : 'Esperando Conexión de Wallet'}
        </div>
      </main>

      {/* --- FOOTER (OPCIONAL) --- */}
      <footer className="py-6 text-center text-gray-600 text-sm border-t border-gray-900">
        © 2026 PFM FoodTrace - Desarrollado sobre Solana Devnet/Local
      </footer>
    </div>
  );
}