import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SecretBallotBox - Privacy-Preserving Voting Platform",
  description: "A secure, privacy-preserving voting platform built on FHEVM technology. Vote with confidence knowing your choices remain encrypted and anonymous.",
  keywords: ["voting", "privacy", "blockchain", "FHEVM", "encryption", "anonymous voting"],
  authors: [{ name: "SecretBallotBox Team" }],
  openGraph: {
    title: "SecretBallotBox - Privacy-Preserving Voting",
    description: "Vote securely with end-to-end encryption. Your privacy is our priority.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gradient-to-br from-blue-50 via-white to-green-50`}>
        <Providers>
          <div className="min-h-full">
            <header className="bg-white shadow-sm border-b border-gray-200">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold gradient-text">
                      🗳️ SecretBallotBox
                    </h1>
                    <span className="ml-3 badge badge-info">
                      Privacy-First Voting
                    </span>
                  </div>
                  <nav className="hidden md:flex space-x-8">
                    <a href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                      Home
                    </a>
                    <a href="/results" className="text-gray-600 hover:text-blue-600 transition-colors">
                      Results
                    </a>
                    <a href="/debug" className="text-gray-600 hover:text-blue-600 transition-colors">
                      Debug
                    </a>
                  </nav>
                </div>
              </div>
            </header>
            
            <main className="flex-1">
              {children}
            </main>
            
            <footer className="bg-gray-50 border-t border-gray-200">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      Powered by FHEVM Technology
                    </span>
                    <span className="badge badge-success">🔒 Encrypted</span>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <p className="text-sm text-gray-600">
                      © 2024 SecretBallotBox. Privacy-preserving voting for everyone.
                    </p>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
