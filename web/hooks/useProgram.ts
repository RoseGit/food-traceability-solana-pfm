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
    // En algunas versiones de Anchor, se pasa el IDL y luego el provider (que ya contiene el ID)
    // o se usa el constructor estático. Esta es la forma más compatible:
    return new Program(idl as Idl, provider);
  }, [connection, wallet]);

  return { program };
};