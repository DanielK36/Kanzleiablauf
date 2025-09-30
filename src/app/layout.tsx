import type { Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Navigation from "@/components/navigation";
import Footer from "@/components/Footer";
import ConsentWrapper from "@/components/ConsentWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "Leadership Enablement System",
  description: "Leadership Enablement System - Team Performance Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    return (
      <html lang="de">
        <body className="antialiased">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">
                    Leadership System
                  </h1>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    Umgebungsvariablen nicht konfiguriert
                  </div>
                </div>
              </div>
            </div>
          </header>
          {children}
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider>
      <html lang="de">
        <body className="antialiased flex flex-col min-h-screen">
          <SignedIn>
            <Navigation />
          </SignedIn>
          <SignedOut>
            <header className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center">
                    <h1 className="text-xl font-bold text-gray-900">
                      Leadership System
                    </h1>
                  </div>
                  <div className="flex items-center space-x-4">
                    <SignInButton mode="modal">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                        Anmelden
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                        Registrieren
                      </button>
                    </SignUpButton>
                  </div>
                </div>
              </div>
            </header>
          </SignedOut>
                   <main className="flex-grow">
                     <ConsentWrapper>
                       {children}
                     </ConsentWrapper>
                   </main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}