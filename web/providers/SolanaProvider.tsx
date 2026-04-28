'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

export const SolanaProvider = ({ children }: { children: React.ReactNode }) => {
    // Usamos tu URL de ngrok como el endpoint principal
    const endpoint = "https://elastic-reimburse-gainfully.ngrok-free.dev";

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