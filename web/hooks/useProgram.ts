/**
 * Hook personalizado para inicializar y acceder al programa (Smart Contract) de Anchor.
 * 
 * Este hook encapsula la lógica de creación del `AnchorProvider` y la instanciación 
 * del objeto `Program`, permitiendo interactuar con las funciones del contrato.
 * 
 * @returns {Object} Un objeto que contiene la instancia del programa.
 * @returns {Program | null} .program - Instancia del programa de Anchor o null si la billetera no está conectada.
 * 
 * @example
 * const { program } = useProgram();
 * 
 * useEffect(() => {
 *   if (program) {
 *     // Llamar a una función del contrato
 *     program.methods.miFuncion().rpc();
 *   }
 * }, [program]);
 * 
 * @description
 * - Requiere que el componente esté envuelto en `SolanaProvider` (Connection y Wallet).
 * - Utiliza `useMemo` para evitar re-instanciar el programa en cada renderizado, 
 *   re-calculándolo solo cuando la conexión o la billetera cambian.
 * - El `preflightCommitment` está configurado en 'processed' para una respuesta rápida de la red.
 */

import { useMemo } from 'react';
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PROGRAM_ID } from '../constants';
import idl from '../constants/food_traceability.json';

export const useProgram = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const program = useMemo(() => {
    if (!wallet) return null;

    // 1. Creamos el Provider
    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: 'processed',
    });

    // 2. Instanciamos el programa    
    return new Program(idl as Idl, provider);
  }, [connection, wallet]);

  return { program };
};