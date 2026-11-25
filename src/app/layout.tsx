import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import "./styles/login.css";
import "./styles/portal.css";
import "./styles/shell.css";
import "./styles/user-menu.css";
import "./styles/logistica.css";
import "./styles/datos.css";
import "./styles/razones-incumplimiento-lib.css";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-montserrat", display: "swap" });

export const metadata: Metadata = {
  title: "Logística | Firplak",
  description: "Información de Logística de Firplak, migrada de Excel a una plataforma web.",
};

export const viewport: Viewport = {
  themeColor: "#324354",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={montserrat.variable}>
      <body>{children}</body>
    </html>
  );
}
