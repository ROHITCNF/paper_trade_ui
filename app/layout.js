import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { SocketProvider } from "./context/SocketContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Paper Trade UI",
  description: "A premium paper trading experience.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SocketProvider>
          <Navbar />
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}
