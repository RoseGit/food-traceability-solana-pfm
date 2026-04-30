import { useState, useEffect } from 'react';
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

export const ActorDashboardView = ({ 
  role, 
  program, 
  publicKey 
}: { 
  role: string, 
  program: any, 
  publicKey: PublicKey | null 
}) => {
  // Estados de navegación y datos
  const [view, setView] = useState<'menu' | 'create' | 'list' | 'transfer' | 'incoming'>('menu');
  const [pendingTransfers, setPendingTransfers] = useState<any[]>([]);  
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<any[]>([]);
  const [acceptedTransfers, setAcceptedTransfers] = useState<any[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedTransferForClient, setSelectedTransferForClient] = useState<any>(null);
  const [clientAddress, setClientAddress] = useState('');
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [transferData, setTransferData] = useState({ toAddress: '', amount: '' });
  const [formData, setFormData] = useState({ name: '', quantity: '' });

  // Función para abrir el formulario de transferencia
  const openTransferForm = (token: any) => {
    setSelectedToken(token);
    setView('transfer');
  };

  // Obtener lotes creados por el usuario
  const fetchMyTokens = async () => {
    if (!program || !publicKey) return;
    try {
      setLoading(true);
      const myBatches = await program.account.batch.all([
        {
          memcmp: {
            offset: 8 + 8,
            bytes: publicKey.toBase58(),
          },
        },
      ]);
      setTokens(myBatches);
    } catch (error) {
      console.error("Error al obtener tokens:", error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener transferencias entrantes (y aceptadas para Retailer)
  const fetchIncomingTransfers = async () => {
    if (!program || !publicKey) return;
    try {
      setLoading(true);
      const incoming = await program.account.transferRequest.all([
        {
          memcmp: {
            offset: 8 + 8 + 32,
            bytes: publicKey.toBase58(),
          },
        },
      ]);

      let filtered;
      if (role.toLowerCase() === 'retailer') {
        filtered = incoming.filter((t: any) => 
          t.account.status.pending !== undefined || t.account.status.accepted !== undefined
        );
      } else {
        filtered = incoming.filter((t: any) => t.account.status.pending !== undefined);
      }

      const enrichedTransfers = await Promise.all(
        filtered.map(async (transfer: any) => {
          try {
            // Extraemos la dirección del batch desde la cuenta
            const batchAddress = transfer.account.batch;

            const [batchPDA] = PublicKey.findProgramAddressSync(
              [
                Buffer.from("batch"),
                transfer.account.batchId.toArrayLike(Buffer, "le", 8)
              ],
              program.programId
            );

            const batchData = await program.account.batch.fetch(batchPDA);
            
            return {
              ...transfer,
              productName: batchData.product,
              origin: batchData.origin,
              batchKey: batchAddress || batchPDA 
            };
          } catch (err) {
            console.error("Error enriqueciendo transferencia:", err);
            return { 
              ...transfer, 
              productName: "Producto Desconocido",
              batchKey: transfer.account.batch
            };
          }
        })
      );

      setPendingTransfers(enrichedTransfers);
    } catch (error) {
      console.error("Error al obtener transferencias:", error);
    } finally {
      setLoading(false);
    }
  };

  // Crear un nuevo lote (Batch)
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program || !publicKey) return;
    setLoading(true);
    try {
      const batchId = new anchor.BN(Date.now());
      const quantityBN = new anchor.BN(formData.quantity);
      const [batchPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("batch"), batchId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      const [actorProfilePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("actor"), publicKey.toBuffer()],
        program.programId
      );
      const parentSources = selectedSources.map(s => new PublicKey(s));

      await program.methods
        .createBatch(
          batchId,
          formData.name,
          role.toLowerCase() === 'producer' ? "Origen Local" : "Procesado en Factory",
          quantityBN,
          parentSources
        )
        .accounts({
          batch: batchPDA,
          actorProfile: actorProfilePDA,
          authority: publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      alert("Lote creado con éxito.");
      setFormData({ name: '', quantity: '' });
      setSelectedSources([]);
      setView('list'); 
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Iniciar una transferencia estándar
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program || !publicKey || !selectedToken) return;
    setLoading(true);
    try {
      const recipientPubKey = new PublicKey(transferData.toAddress);
      const amountBN = new anchor.BN(transferData.amount);
      const seedNonce = new anchor.BN(Date.now());

      const [transferRequestPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("transfer"),
          publicKey.toBuffer(),
          selectedToken.publicKey.toBuffer(),
          seedNonce.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const [senderProfilePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("actor"), publicKey.toBuffer()],
        program.programId
      );

      const [recipientProfilePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("actor"), recipientPubKey.toBuffer()],
        program.programId
      );

      await program.methods
        .initiateTransfer(amountBN, seedNonce)
        .accounts({
          transferRequest: transferRequestPDA,
          batch: selectedToken.publicKey,
          senderProfile: senderProfilePDA,
          recipientProfile: recipientProfilePDA,
          recipientWallet: recipientPubKey,
          authority: publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      alert("Transferencia iniciada.");
      setView('list');
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTransfer = async (transfer: any) => {
    if (!program || !publicKey) return;
    setLoading(true);
    try {
      const [batchPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("batch"), transfer.account.batchId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      await program.methods
        .acceptTransfer()
        .accounts({
          transferRequest: transfer.publicKey,
          batch: batchPDA,
          to: publicKey,
        })
        .rpc();
      alert("Custodia aceptada.");
      fetchIncomingTransfers();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectTransfer = async (transferPDA: PublicKey) => {
    if (!program || !publicKey) return;
    setLoading(true);
    try {
      await program.methods
        .rejectTransfer()
        .accounts({
          transferRequest: transferPDA,
          to: publicKey,
        })
        .rpc();
      alert("Transferencia rechazada.");
      fetchIncomingTransfers();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSaleSubmit = async () => {
    if (!program || !publicKey || !selectedTransferForClient || !clientAddress) return;
    setLoading(true);
    try {
      const recipientPubKey = new PublicKey(clientAddress);
      const amountBN = new anchor.BN(selectedTransferForClient.account.quantity);
      const seedNonce = new anchor.BN(Date.now());
      const batchKey = selectedTransferForClient.batchKey;

      if (!batchKey) throw new Error("No se encontró el BatchKey.");

      const [transferRequestPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("transfer"),
          publicKey.toBuffer(),
          selectedTransferForClient.account.batchId.toArrayLike(Buffer, "le", 8),
          seedNonce.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const [senderProfilePDA] = PublicKey.findProgramAddressSync([Buffer.from("actor"), publicKey.toBuffer()], program.programId);
      const [recipientProfilePDA] = PublicKey.findProgramAddressSync([Buffer.from("actor"), recipientPubKey.toBuffer()], program.programId);

      await program.methods
        .initiateTransfer(amountBN, seedNonce)
        .accounts({
          transferRequest: transferRequestPDA,
          batch: new PublicKey(batchKey.toString()),
          senderProfile: senderProfilePDA,
          recipientProfile: recipientProfilePDA,
          recipientWallet: recipientPubKey,
          authority: publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      alert("¡Venta registrada!");
      setIsTransferModalOpen(false);
      setClientAddress('');
      fetchIncomingTransfers();
    } catch (error: any) {
      alert("Error en venta: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcceptedTransfers = async () => {
    if (!program || !publicKey) return;
    try {
      setLoading(true);
      const incoming = await program.account.transferRequest.all([
        { memcmp: { offset: 8 + 8 + 32, bytes: publicKey.toBase58() } },
      ]);
      const accepted = incoming.filter((t: any) => t.account.status.accepted !== undefined);
      const enriched = await Promise.all(
        accepted.map(async (transfer: any) => {
          const [batchPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("batch"), transfer.account.batchId.toArrayLike(Buffer, "le", 8)],
            program.programId
          );
          const batchData = await program.account.batch.fetch(batchPDA);
          return { ...transfer, productName: batchData.product };
        })
      );
      setAcceptedTransfers(enriched);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'incoming') fetchIncomingTransfers();
    if (view === 'list') fetchMyTokens();
    if (view === 'create' && role.toLowerCase() === 'factory') fetchAcceptedTransfers();
  }, [view]);

  return (
    <div className="min-h-screen bg-[#0f1114] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex justify-between items-center">
          <div onClick={() => setView('menu')} className="cursor-pointer">
            <h1 className="text-4xl font-extrabold mb-2">
              Panel de <span className="text-blue-500 uppercase">{role}</span>
            </h1>
          </div>
          <WalletMultiButton />
        </header>

        {view === 'menu' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {role.toLowerCase() !== 'retailer' && (
              <div onClick={() => setView('create')} className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 cursor-pointer">
                <div className="text-4xl mb-4">🪙</div>
                <h3 className="text-2xl font-bold mb-3 text-blue-500">Crear un token</h3>
              </div>
            )}
            {role.toLowerCase() !== 'retailer' && (
              <div onClick={() => setView('list')} className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 cursor-pointer">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold mb-3 text-blue-500">Ver mis tokens</h3>
              </div>
            )}
            {role.toLowerCase() !== 'producer' && (
              <div onClick={() => setView('incoming')} className="bg-[#161b22] border border-indigo-800/30 rounded-2xl p-8 hover:border-indigo-500/50 cursor-pointer">
                <div className="text-4xl mb-4">📦</div>
                <h3 className="text-2xl font-bold mb-3 text-indigo-400">Transferencias</h3>
              </div>
            )}
          </div>
        )}

        {view === 'create' && (
          <div className="max-w-2xl mx-auto bg-[#161b22] p-8 rounded-2xl border border-gray-800">
            <h3 className="text-2xl font-bold mb-6 text-blue-500">Nuevo Lote</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-6">
              <input required className="w-full bg-[#0f1114] border border-gray-700 p-3 rounded-xl" placeholder="Nombre" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              <input required type="number" className="w-full bg-[#0f1114] border border-gray-700 p-3 rounded-xl" placeholder="Cantidad" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} />
              <div className="flex gap-4">
                <button type="button" onClick={() => setView('menu')} className="flex-1 p-3 border border-gray-700 rounded-xl">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 p-3 bg-blue-600 rounded-xl">Crear</button>
              </div>
            </form>
          </div>
        )}

        {view === 'list' && (
          <div className="grid gap-4">
            {tokens.map((token) => (
              <div key={token.publicKey.toBase58()} className="bg-[#161b22] border border-gray-800 p-6 rounded-2xl flex justify-between items-center">
                <div>
                  <h4 className="text-xl font-bold">{token.account.product}</h4>
                  <p className="text-sm text-gray-400">Cantidad: {token.account.quantity.toString()}</p>
                </div>
                <button onClick={() => openTransferForm(token)} className="bg-blue-500/10 text-blue-400 px-6 py-2 rounded-xl border border-blue-500/20 font-bold">Transferir</button>
              </div>
            ))}
          </div>
        )}

        {view === 'incoming' && (
          <div className="grid gap-4">
            {pendingTransfers.map((transfer) => (
              <div key={transfer.publicKey.toBase58()} className="bg-[#161b22] border border-gray-800 p-6 rounded-2xl flex justify-between items-center">
                <div>
                  <h4 className="text-xl font-bold capitalize">{transfer.productName}</h4>
                  <p className="text-sm text-gray-400">Cantidad: {transfer.account.quantity.toString()}</p>
                </div>
                <div className="flex gap-2">
                  {role.toLowerCase() === 'retailer' && transfer.account.status.accepted !== undefined ? (
                    <button onClick={() => { setSelectedTransferForClient(transfer); setIsTransferModalOpen(true); }} className="px-6 py-2 bg-orange-600 rounded-xl font-bold">Vender al Cliente</button>
                  ) : (
                    <>
                      <button onClick={() => handleRejectTransfer(transfer.publicKey)} className="px-6 py-2 border border-red-500/30 text-red-400 rounded-xl">Rechazar</button>
                      <button onClick={() => handleAcceptTransfer(transfer)} className="px-6 py-2 bg-indigo-600 rounded-xl">Aceptar</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {isTransferModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#161b22] p-8 rounded-2xl max-w-md w-full border border-gray-800 shadow-2xl">
              <h3 className="text-2xl font-bold text-orange-500 mb-4">Venta al Cliente</h3>
              <input type="text" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder="Wallet Cliente" className="w-full bg-[#0f1114] border border-gray-700 p-3 rounded-xl mb-6 text-white" />
              <div className="flex gap-3">
                <button onClick={() => setIsTransferModalOpen(false)} className="flex-1 p-3 border border-gray-700 rounded-xl">Cancelar</button>
                <button onClick={handleFinalSaleSubmit} className="flex-1 p-3 bg-orange-600 rounded-xl font-bold">Confirmar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};