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