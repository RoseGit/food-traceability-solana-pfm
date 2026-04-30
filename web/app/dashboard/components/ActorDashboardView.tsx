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

  console.log("Rol actual recibido:", role);

  // Estados de navegación y datos
  const [view, setView] = useState<'menu' | 'create' | 'list' | 'transfer' | 'incoming'>('menu');
  const [pendingTransfers, setPendingTransfers] = useState<any[]>([]);  
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<any[]>([]);
  const [acceptedTransfers, setAcceptedTransfers] = useState<any[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]); // Guardará las PKs de las transferencias

  // 1. Añade estos estados nuevos dentro de ActorDashboardView
    const [selectedToken, setSelectedToken] = useState<any>(null);
    const [transferData, setTransferData] = useState({ toAddress: '', amount: '' });
  
  // Estado del formulario
  const [formData, setFormData] = useState({ name: '', quantity: '' });

  // 2. Función para abrir el formulario de transferencia
const openTransferForm = (token: any) => {
  setSelectedToken(token);
  setView('transfer');
};

  // Función para obtener los tokens de la blockchain
  const fetchMyTokens = async () => {
    if (!program || !publicKey) return;
    try {
      setLoading(true);
      // Filtramos los lotes (batch) donde el creador sea la wallet actual
      const myBatches = await program.account.batch.all([
        {
          memcmp: {
            offset: 8 + 8, // 8 (discriminator) + 8 (id u64)
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

  const fetchIncomingTransfers = async () => {
  if (!program || !publicKey) return;
  try {
    setLoading(true);
    
    // 1. Obtener todas las transferencias dirigidas a mí
    const incoming = await program.account.transferRequest.all([
      {
        memcmp: {
          offset: 8 + 8 + 32, // to
          bytes: publicKey.toBase58(),
        },
      },
    ]);

    // 2. Filtrar solo las pendientes
    const filtered = (role.toLowerCase() === 'retailer' || role.toLowerCase() === 'consumer')
        ? incoming.filter((t: any) => t.account.status.pending !== undefined || t.account.status.accepted !== undefined)
        : incoming.filter((t: any) => t.account.status.pending !== undefined);

    // 3. "Enriquecer" los datos buscando el nombre del producto en cada Batch
    const enrichedTransfers = await Promise.all(
      filtered.map(async (transfer: any) => {
        try {
          // Calculamos la PDA del Batch para obtener su información
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
            productName: batchData.product, // Guardamos el nombre aquí
            origin: batchData.origin
          };
        } catch (err) {
          console.error("Error recuperando info del batch:", err);
          return { ...transfer, productName: "Producto Desconocido" };
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

// Cargar datos cuando se entra a la vista de transferencias
useEffect(() => {
  if (view === 'incoming') {
    fetchIncomingTransfers();
  }
}, [view]);

  // Cargar tokens si entramos a la vista de lista
  useEffect(() => {
    if (view === 'list') {
      fetchMyTokens();
    }
  }, [view]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!program || !publicKey) return;

  setLoading(true);
  try {
    const batchId = new anchor.BN(Date.now());
    const quantityBN = new anchor.BN(formData.quantity);

    // 1. Calculamos la PDA para el nuevo lote (Batch)
    const [batchPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("batch"), batchId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const [actorProfilePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("actor"), publicKey.toBuffer()],
      program.programId
    );

    // 2. Preparamos el array de fuentes (parent_sources)
    // Si el usuario seleccionó fuentes, las convertimos. Si no, enviamos array vacío.
    const parentSources = selectedSources.map(s => new PublicKey(s));

    // 3. Llamada al método actualizado en el Smart Contract
    await program.methods
      .createBatch(
        batchId,
        formData.name,
        role.toLowerCase() === 'producer' ? "Origen Local" : "Procesado en Factory",
        quantityBN,
        parentSources // <-- Pasamos el nuevo parámetro aquí
      )
      .accounts({
        batch: batchPDA,
        actorProfile: actorProfilePDA,
        authority: publicKey,
        // Nota: systemProgram y otros suelen resolverse solos en versiones modernas de Anchor,
        // pero puedes agregarlos si tu versión lo requiere.
      })
      .rpc();

    // 4. Limpieza y éxito
    alert(`Lote creado con éxito. Insumos vinculados: ${parentSources.length}`);
    setFormData({ name: '', quantity: '' });
    setSelectedSources([]); // Limpiamos la selección
    setView('list'); 
    
  } catch (error: any) {
    console.error("Error al crear lote:", error);
    alert("Error en la transacción: " + error.message);
  } finally {
    setLoading(false);
  }
};

  // 3. Función para enviar la transferencia a la blockchain
  const handleTransferSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!program || !publicKey || !selectedToken) return;

  setLoading(true);
  try {
    const recipientPubKey = new PublicKey(transferData.toAddress);
    const amountBN = new anchor.BN(transferData.amount);
    const seedNonce = new anchor.BN(Date.now()); // El ID único que añadimos

    // 1. PDA de la transferencia
    const [transferRequestPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("transfer"),
        publicKey.toBuffer(),
        selectedToken.publicKey.toBuffer(),
        seedNonce.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    // 2. PDA del emisor (Tú)
    const [senderProfilePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("actor"), publicKey.toBuffer()],
      program.programId
    );

    // 3. PDA del receptor (A quien le envías)
    const [recipientProfilePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("actor"), recipientPubKey.toBuffer()],
      program.programId
    );

    // 4. Llamada explícita (pasa todas las cuentas para evitar el auto-resolution)
    const tx = await program.methods
      .initiateTransfer(amountBN, seedNonce)
      .accounts({
        transferRequest: transferRequestPDA,
        batch: selectedToken.publicKey,
        senderProfile: senderProfilePDA,
        recipientProfile: recipientProfilePDA,
        recipientWallet: recipientPubKey, // Esta es la cuenta UncheckedAccount / AccountInfo
        authority: publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    alert("Transferencia iniciada correctamente.");
    setView('list');
  } catch (error: any) {
    console.error("Error:", error);
    alert("Error: " + error.message);
  } finally {
    setLoading(false);
  }
};

const handleAcceptTransfer = async (transfer: any) => {
  if (!program || !publicKey) return;

  setLoading(true);
  try {
    // 1. Calculamos la PDA del Batch original para poder actualizarlo
    // Usamos el batchId que viene guardado en la cuenta de transferencia
    const [batchPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("batch"),
        transfer.account.batchId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    // 2. Llamada a la instrucción accept_transfer en Rust
    const tx = await program.methods
      .acceptTransfer()
      .accounts({
        transferRequest: transfer.publicKey,
        batch: batchPDA,
        to: publicKey, // La Factory/Retailer que firma la aceptación
      })
      .rpc();

    console.log("Transferencia aceptada con éxito:", tx);
    alert("Custodia aceptada. El inventario ha sido actualizado.");
    
    // 3. Refrescamos la vista de transferencias entrantes
    fetchIncomingTransfers();
  } catch (error: any) {
    console.error("Error al aceptar transferencia:", error);
    alert("No se pudo completar la operación: " + error.message);
  } finally {
    setLoading(false);
  }
};

const handleRejectTransfer = async (transferPDA: PublicKey) => {
  if (!program || !publicKey) return;

  setLoading(true);
  try {
    // Llamada a la instrucción en Rust
    const tx = await program.methods
      .rejectTransfer()
      .accounts({
        transferRequest: transferPDA,
        to: publicKey, // La Factory/Retailer que está rechazando
      })
      .rpc();

    console.log("Transferencia rechazada:", tx);
    alert("Has rechazado la transferencia exitosamente.");
    
    // Refrescamos la lista para que desaparezca la solicitud rechazada
    fetchIncomingTransfers();
  } catch (error: any) {
    console.error("Error al rechazar:", error);
    alert("Error al rechazar la transferencia: " + error.message);
  } finally {
    setLoading(false);
  }
};

const fetchAcceptedTransfers = async () => {
  if (!program || !publicKey) return;
  try {
    setLoading(true);
    // 1. Buscamos las transferencias donde yo soy el destinatario
    const incoming = await program.account.transferRequest.all([
      {
        memcmp: {
          offset: 8 + 8 + 32, // Campo 'to'
          bytes: publicKey.toBase58(),
        },
      },
    ]);

    // 2. Filtramos solo las que ya fueron ACEPTADAS
    const accepted = incoming.filter((t: any) => t.account.status.accepted !== undefined);

    // 3. Buscamos el nombre del producto en el Batch original de cada transferencia
    const enriched = await Promise.all(
      accepted.map(async (transfer: any) => {
        try {
          const [batchPDA] = anchor.web3.PublicKey.findProgramAddressSync(
            [
              Buffer.from("batch"),
              transfer.account.batchId.toArrayLike(Buffer, "le", 8)
            ],
            program.programId
          );
          const batchData = await program.account.batch.fetch(batchPDA);
          return {
            ...transfer,
            productName: batchData.product // Guardamos el nombre real
          };
        } catch (err) {
          return { ...transfer, productName: "Lote Desconocido" };
        }
      })
    );

    setAcceptedTransfers(enriched);
  } catch (error) {
    console.error("Error al obtener insumos:", error);
  } finally {
    setLoading(false);
  }
};

// Llamar a esta función cuando el Factory entre a 'create'
useEffect(() => {
  if (view === 'create' && role.toLowerCase() === 'factory') {
    fetchAcceptedTransfers();
  }
}, [view]);


  return (
    <div className="min-h-screen bg-[#0f1114] text-white font-sans p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex justify-between items-center">
          <div onClick={() => setView('menu')} className="cursor-pointer">
            <h1 className="text-4xl font-extrabold mb-2 text-white">
              Panel de <span className="text-blue-500 uppercase">{role}</span>
            </h1>
            <p className="text-gray-400">Gestiona tus activos en la red de FoodTrace.</p>
          </div>
          <WalletMultiButton />
        </header>



{view === 'menu' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Ocultar 'Crear token' para Retailer y Customer */}
            {role.toLowerCase() !== 'retailer' && role.toLowerCase() !== 'consumer' && (
              <div onClick={() => setView('create')} className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all group cursor-pointer">
                <div className="text-4xl mb-4">🪙</div>
                <h3 className="text-2xl font-bold mb-3 text-blue-500">Crear un token</h3>
                <p className="text-gray-400">Registra un nuevo lote de producto.</p>
              </div>
            )}

            {/* Ocultar 'Ver mis tokens' para Retailer y Customer */}
            {role.toLowerCase() !== 'retailer' && role.toLowerCase() !== 'consumer' && (
              <div onClick={() => setView('list')} className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all group cursor-pointer">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold mb-3 text-blue-500">Ver mis tokens</h3>
                <p className="text-gray-400">Consulta tus activos actuales.</p>
              </div>
            )}

            {/* Visible para Retailer, Customer y Factory (Todo excepto Producer) */}
            {role.toLowerCase() !== 'producer' && (
              <div onClick={() => setView('incoming')} className="bg-[#161b22] border border-indigo-800/30 rounded-2xl p-8 hover:border-indigo-500/50 transition-all group cursor-pointer">
                <div className="text-4xl mb-4">📦</div>
                <h3 className="text-2xl font-bold mb-3 text-indigo-400">Transferencias</h3>
                <p className="text-gray-400">
                  {role.toLowerCase() === 'customer' 
                    ? "Consulta tus productos comprados." 
                    : "Gestiona los productos recibidos y enviados."}
                </p>
              </div>
            )}
          </div>
        )}

        {view === 'create' && (
  <div className="max-w-2xl mx-auto bg-[#161b22] border border-gray-800 rounded-2xl p-8">
    <h3 className="text-2xl font-bold mb-6 text-blue-500">Nuevo Lote de Producción </h3>
    
    <form onSubmit={handleCreateSubmit} className="space-y-6">
      {/* Campos básicos */}
      <div className="grid md:grid-cols-2 gap-4">
        <input required className="bg-[#0f1114] border border-gray-700 rounded-xl p-3 text-white outline-none" placeholder="Nombre del producto final (ej: Salsa)" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
        <input required type="number" className="bg-[#0f1114] border border-gray-700 rounded-xl p-3 text-white outline-none" placeholder="Cantidad producida" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} />
      </div>

      {/* SECCIÓN DE SOURCE TOKENS */}
      <div className="border-t border-gray-800 pt-6">
        <label className="block text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">
          Seleccionar Insumos (Source Tokens)
        </label>
        
        {acceptedTransfers.length === 0 ? (
          <p className="text-gray-500 text-sm italic bg-[#0f1114] p-4 rounded-xl border border-dashed border-gray-700">
            No tienes transferencias aceptadas disponibles como insumos.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
  {acceptedTransfers.map((transfer) => (
    <div 
      key={transfer.publicKey.toBase58()}
      onClick={() => {
        const pk = transfer.publicKey.toBase58();
        setSelectedSources(prev => 
          prev.includes(pk) ? prev.filter(i => i !== pk) : [...prev, pk]
        );
      }}
      className={`p-4 rounded-xl border transition-all flex justify-between items-center ${
        selectedSources.includes(transfer.publicKey.toBase58())
        ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
        : 'border-gray-800 bg-[#0f1114] hover:border-gray-600'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`text-xl ${selectedSources.includes(transfer.publicKey.toBase58()) ? 'opacity-100' : 'opacity-40'}`}>
          📦
        </div>
        <div>
          {/* Mostramos el nombre enriquecido */}
          <p className="font-bold text-white text-sm capitalize">
            {transfer.productName}
          </p>
          <div className="flex gap-3 mt-0.5">
            <p className="text-[10px] text-gray-500 font-mono">
              ID: #{transfer.account.batchId.toString().slice(-6)}
            </p>
            <p className="text-[10px] text-blue-400 font-bold uppercase">
              Disponible: {transfer.account.quantity.toString()} unidades
            </p>
          </div>
        </div>
      </div>
      
      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
        selectedSources.includes(transfer.publicKey.toBase58())
        ? 'bg-blue-500 border-blue-500'
        : 'border-gray-600'
      }`}>
        {selectedSources.includes(transfer.publicKey.toBase58()) && (
          <span className="text-white text-xs">✓</span>
        )}
      </div>
    </div>
  ))}
</div>
        )}
      </div>

      <div className="flex gap-4 pt-4">
        <button type="button" onClick={() => setView('menu')} className="flex-1 px-4 py-3 border border-gray-700 text-gray-400 rounded-xl">Cancelar</button>
        <button type="submit" disabled={loading || (role.toLowerCase() === 'factory' && selectedSources.length === 0)} className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50">
          {loading ? "Procesando..." : "Crear Token"}
        </button>
      </div>
    </form>
  </div>
)}

        {view === 'list' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-blue-500">Mis Tokens Registrados</h3>
              <button onClick={() => setView('menu')} className="text-gray-400 hover:text-white">← Volver</button>
            </div>
            
            {loading ? (
              <p className="text-center text-gray-500 py-10">Cargando datos de la blockchain...</p>
            ) : tokens.length === 0 ? (
              <p className="text-center text-gray-500 py-10 bg-[#161b22] rounded-xl border border-gray-800 italic">No tienes tokens creados aún.</p>
            ) : (
              <div className="grid gap-4">
                {tokens.map((token) => (
                  <div key={token.publicKey.toBase58()} className="bg-[#161b22] border border-gray-800 p-6 rounded-2xl flex items-center justify-between hover:border-gray-700 transition-all">
                    <div>
                      <h4 className="text-xl font-bold text-white">{token.account.product}</h4>
                      <div className="flex gap-4 mt-1">
                        <p className="text-sm text-gray-400">ID: <span className="font-mono text-blue-400">#{token.account.id.toString()}</span></p>
                        <p className="text-sm text-gray-400">Cantidad: <span className="text-white font-bold">{token.account.quantity.toString()}</span></p>
                      </div>
                    </div>
                    
                    
                    <button 
  onClick={() => openTransferForm(token)} // Cambiamos el comportamiento aquí
  className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-6 py-2 rounded-xl font-bold hover:bg-blue-500 hover:text-white transition-all"
>
  Transferir
</button>


                  </div>
                ))}
              </div>
            )}
          </div>
        )}


{view === 'transfer' && selectedToken && (
  <div className="max-w-md mx-auto animate-in fade-in duration-300">
    <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-8">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-blue-500">Transferir Producto</h3>
        <p className="text-gray-400 text-sm italic">
          Estas transfiriendo parte del lote: {selectedToken.account.product}
        </p>
      </div>

      <form onSubmit={handleTransferSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Dirección de la Factory (Wallet)</label>
          <input
            required
            type="text"
            className="w-full bg-[#0f1114] border border-gray-700 rounded-xl p-3 text-white font-mono text-sm focus:border-blue-500 outline-none"
            placeholder="Dirección pública (Base58)"
            value={transferData.toAddress}
            onChange={(e) => setTransferData({...transferData, toAddress: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
            Cantidad a transferir (Máx: {selectedToken.account.quantity.toString()})
          </label>
          <input
            required
            type="number"
            max={selectedToken.account.quantity.toString()}
            className="w-full bg-[#0f1114] border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
            placeholder="0"
            value={transferData.amount}
            onChange={(e) => setTransferData({...transferData, amount: e.target.value})}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => setView('list')}
            className="flex-1 px-4 py-3 border border-gray-700 text-gray-400 rounded-xl hover:bg-gray-800"
          >
            Volver
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? "Procesando..." : "Enviar"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}


{view === 'incoming' && (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="flex justify-between items-center">
      <h3 className="text-2xl font-bold text-indigo-400">Solicitudes Entrantes</h3>
      <button onClick={() => setView('menu')} className="text-gray-400 hover:text-white">← Volver</button>
    </div>
    
    {loading ? (
      <p className="text-center text-gray-500 py-10">Consultando la blockchain...</p>
    ) : pendingTransfers.length === 0 ? (
      <div className="text-center py-20 bg-[#161b22] border border-gray-800 rounded-2xl">
        <p className="text-gray-500">No hay transferencias pendientes.</p>
      </div>
    ) : (
      <div className="grid gap-4">
        {pendingTransfers.map((transfer) => {
          // Variables auxiliares para limpiar la lógica visual
          const isAccepted = transfer.account.status.accepted !== undefined;
          const userRole = role.toLowerCase();
          const isCustomer = userRole === 'customer' || userRole === 'client' || userRole === 'user'; // Ajusta según tu console.log
          const isRetailer = userRole === 'retailer';

          return (
            <div key={transfer.publicKey.toBase58()} className="bg-[#161b22] border border-gray-800 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="text-3xl bg-[#0f1114] p-3 rounded-lg">📦</div>
                <div>
                  <h4 className="text-xl font-bold text-white capitalize">
                    {transfer.productName} 
                  </h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <p className="text-sm text-gray-400">
                      Lote: <span className="font-mono text-blue-400">#{transfer.account.batchId.toString().slice(-6)}</span>
                    </p>
                    <p className="text-sm text-gray-400">
                      Cantidad: <span className="text-green-400 font-bold">{transfer.account.quantity.toString()}</span>
                    </p>
                    {isAccepted && (
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold uppercase">
                        ✓ En posesión
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                {/* 1. CASO: PRODUCTO YA ACEPTADO */}
                {isAccepted ? (
                  <>
                    {isRetailer ? (
                      /* Si es Retailer, puede transferir al cliente */
                      <button 
                        onClick={async () => {
                          const [batchPDA] = PublicKey.findProgramAddressSync(
                            [Buffer.from("batch"), transfer.account.batchId.toArrayLike(Buffer, "le", 8)],
                            program.programId
                          );
                          setSelectedToken({
                            publicKey: batchPDA,
                            account: { product: transfer.productName, quantity: transfer.account.quantity }
                          });
                          setView('transfer');
                        }}
                        className="flex-1 md:flex-none px-6 py-3 rounded-xl font-bold bg-green-600 text-white hover:bg-green-500 transition-all shadow-lg shadow-green-900/20"
                      >
                        Transferir al cliente
                      </button>
                    ) : isCustomer ? (
                      /* Si es Customer y ya aceptó, ocultamos botones y mostramos info */
                      <div className="text-green-400 font-bold flex items-center px-4 py-2 border border-green-500/20 rounded-xl bg-green-500/5">
                         Confirmado
                      </div>
                    ) : null}
                  </>
                ) : (
                  /* 2. CASO: PRODUCTO PENDIENTE (Botones para todos los roles) */
                  <>
                    <button 
                      disabled={loading}
                      onClick={() => handleRejectTransfer(transfer.publicKey)}
                      className="flex-1 md:flex-none px-6 py-2 rounded-xl font-bold border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                    >
                      {loading ? "..." : "Rechazar"}
                    </button>
                    <button 
                      disabled={loading}
                      onClick={() => handleAcceptTransfer(transfer)}
                      className="flex-1 md:flex-none px-6 py-2 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-50"
                    >
                      {loading ? "..." : "Aceptar"}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
)}





      </div>
    </div>
  );
};