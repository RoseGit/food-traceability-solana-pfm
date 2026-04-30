import { PublicKey } from "@solana/web3.js";

/**
 * Identificador único del programa (Smart Contract) en la red de Solana.
 * Este ID debe coincidir con el declarado en el archivo Anchor.toml y lib.rs del contrato.
 * 
 * @constant
 * @type {PublicKey}
 */
export const PROGRAM_ID = new PublicKey("Fw6zjywTLYyq7DLLQkiBGHgpKteCpgbamrHbXdiJdgCg");

/**
 * Punto de enlace (URL) del nodo RPC para interactuar con la blockchain.
 * Actualmente configurado para apuntar al validador local de Solana.
 * 
 * @constant
 * @type {string}
 * @default "http://127.0.0.1:8899"
 * 
 * @note Si usas un túnel como ngrok, asegúrate de actualizar esta URL 
 * si el túnel se reinicia.
 */
export const RPC_ENDPOINT = "http://127.0.0.1:8899";