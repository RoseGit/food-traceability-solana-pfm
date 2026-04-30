'use client';

import { useState, useEffect } from 'react';
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "../../hooks/useProgram";
import { useRouter } from 'next/navigation';
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { AdminDashboardView } from './components/AdminDashboardView';
import { ActorDashboardView } from './components/ActorDashboardView';

// Componentes modularizados
import { InitializeView } from './components/InitializeView';
import { RoleSelection } from './components/RoleSelection';
import { PendingRequest } from './components/PendingRequest';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isActor, setIsActor] = useState(false);
  const [actorData, setActorData] = useState<any>(null);

  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'error' | 'success' | 'info' | null }>({
    message: '',
    type: null
  });

  const { connected, publicKey } = useWallet();
  const { program } = useProgram();
  const router = useRouter();
  const [lastPublicKey, setLastPublicKey] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [requestPending, setRequestPending] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Verificar inicialización
  useEffect(() => {
    const checkStatus = async () => {
      if (!program || !publicKey) return;

      try {
        const [configPDA] = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId);
        const configAccount = await program.account.programConfig.fetch(configPDA);

        if (configAccount) {
          // Si llegamos aquí, la cuenta existe, por lo tanto ESTÁ inicializado
          setIsInitialized(true);
          const isAdministrator = configAccount.authority.toBase58() === publicKey.toBase58();
          setIsAdmin(isAdministrator);
          const currentWallet = publicKey.toBase58();
          const adminWallet = configAccount.authority.toBase58();

          console.log("Admin en cuenta:", adminWallet);
          console.log("Tu Wallet:", currentWallet);

          if (isAdministrator) {
            return;
          }
        }



        // 2. VERIFICAR SI ES UN ACTOR REGISTRADO
        const [actorPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("actor"), publicKey.toBuffer()],
          program.programId
        );

        try {
          const actorAccount = await program.account.actor.fetch(actorPDA);
          if (actorAccount) {
            setIsActor(true);
            setActorData(actorAccount);
            return; // Si encontramos al actor, salimos.
          }
        } catch (e) {
          // Silenciamos el error: es normal que no sea actor aún.
          console.log("No es un actor registrado todavía.");
        }

        // 3. VERIFICAR SI TIENE SOLICITUD PENDIENTE
        try {
          const [requestPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("request"), publicKey.toBuffer()],
            program.programId
          );
          const requestAccount = await program.account.roleRequest.fetch(requestPDA);
          if (requestAccount) {
            setRequestPending(true);
          }
        } catch (e) {
          // Silenciamos el error: es un usuario totalmente nuevo.
          console.log("No tiene solicitudes pendientes.");
          // IMPORTANTE: Aquí no hacemos nada, simplemente dejamos que el flujo siga
          // para que al final se renderice el RoleSelection.
        }




      } catch (e: any) {
        // Solo marcamos como NO inicializado si el error es que la cuenta no existe
        if (e.message.includes("Account does not exist")) {
          setIsInitialized(false);
        } else {
          console.error("Error inesperado en checkStatus:", e);
        }
      }
    };
    if (mounted && program && publicKey) checkStatus();
  }, [mounted, program, publicKey]);

  // Manejo de cambio de wallet (Redirección segura)
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

      const [configPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );

      const tx = await program.methods
        .initialize()
        .accounts({
          config: configPDA,
          admin: publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      setStatus({ message: '¡Inicialización exitosa!', type: 'success' });
      setIsInitialized(true);
      setIsAdmin(true);
    } catch (error: any) {
      setStatus({ message: error.message, type: 'error' });
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

      // Convertimos el string del rol al formato que espera el Enum en Rust
      // Ej: "Producer" -> { producer: {} }
      const roleParam = { [role.toLowerCase()]: {} };

      console.log("Enviando solicitud para el rol:", roleParam);

      // LLAMADA AL NUEVO MÉTODO
      const tx = await program.methods
        .requestRole(
          "Usuario Nuevo", // Puedes cambiar esto por un input de nombre más adelante
          roleParam,
          "Ubicación pendiente"
        )
        .accounts({
          // La PDA 'roleRequest' y 'systemProgram' suelen ser 
          // inferidas automáticamente por Anchor 0.30+
        })
        .rpc();

      console.log("Transacción de solicitud exitosa:", tx);

      // Cambiamos el estado para mostrar la vista de "Pendiente"
      setRequestPending(true);

    } catch (error: any) {
      console.error("Error al solicitar rol:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- CORRECCIÓN EN LA RENDERIZACIÓN ---

  // 1. Cargando estados iniciales
  if (!mounted || isInitialized === null) {
    return <div className="bg-[#0f1114] min-h-screen flex items-center justify-center text-white">Cargando...</div>;
  }

  // 2. Si no está inicializado
  if (isInitialized === false) {
    return <InitializeView onInitialize={handleInitialize} loading={loading} connected={connected} status={status} />;
  }

  // 3. SI EL USUARIO ES ADMIN: Mostrar Dashboard de Admin
  if (isAdmin) {
    return <AdminDashboardView program={program} />;
  }

  // Actor registrado 
  if (isActor && actorData) {
    const roleName = Object.keys(actorData.role)[0];
    return <ActorDashboardView
      role={roleName}
      program={program}
      publicKey={publicKey}
    />;
  }

  // 4. Si la solicitud de rol está pendiente (Para usuarios comunes)
  if (requestPending) {
    return <PendingRequest selectedRole={selectedRole} onBack={() => router.push('/')} />;
  }

  // 5. Pantalla normal de selección de roles
  return <RoleSelection onSelectRole={handleRequestRole} loading={loading} selectedRole={selectedRole} />;
}