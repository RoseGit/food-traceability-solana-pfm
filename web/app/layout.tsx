/**
 * RootLayout - El componente de diseño raíz de la aplicación.
 * 
 * Este archivo define la estructura HTML básica y provee los contextos globales
 * necesarios para el funcionamiento de la dApp.
 * 
 * @component
 * @param {Object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - Representa las páginas y componentes hijos (Dashboard, Home, etc.).
 * 
 * @description
 * - Inyección de Fuentes: Configura `DM Sans` como la tipografía global usando `next/font`.
 * - Estilos Globales: Importa el CSS principal y los estilos necesarios para los modales de Solana Wallet Adapter.
 * - Proveedores de Estado: Envuelve la aplicación en `SolanaProvider` para habilitar la conexión a la blockchain en todo el sitio.
 */

import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { SolanaProvider } from "../providers/SolanaProvider";
import "@solana/wallet-adapter-react-ui/styles.css";

// ✅ Fuente correcta (reemplaza el @import de CSS)
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Trazabilidad Alimentaria",
  description: "App con conexión a wallet Solana",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={dmSans.className}>
        <SolanaProvider>
          {children}
        </SolanaProvider>
      </body>
    </html>
  );
}