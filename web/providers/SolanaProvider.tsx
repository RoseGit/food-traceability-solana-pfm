/**
 * SolanaProvider
 * 
 * Proveedor de contexto de alto nivel que inicializa la conexión a la red de Solana
 * y gestiona el estado de las billeteras (wallets) para la aplicación.
 * 
 * @component
 * @param {Object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - Componentes hijos que tendrán acceso al contexto de Solana.
 * 
 * @example
 * return (
 *   <SolanaProvider>
 *     <App />
 *   </SolanaProvider>
 * )
 * 
 * @description
 * - Utiliza `ConnectionProvider` para establecer el punto de enlace (endpoint) RPC.
 * - Utiliza `WalletProvider` para gestionar la conexión con adaptadores de billetera compatibles con Wallet Standard (ej. Backpack, Phantom).
 * - Utiliza `WalletModalProvider` para habilitar la interfaz de selección de billetera de Solana UI.
 */

'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

export const SolanaProvider = ({ children }: { children: React.ReactNode }) => {
    // Usamos tu URL de ngrok como el endpoint principal
    const endpoint = "http://127.0.0.1:8899";

    // Mantenemos wallets vacío para usar el Wallet Standard (Backpack)
    const wallets = useMemo(() => [], []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};