"use client";

import AppShell from "@/components/AppShell";

export default function Home() {
  return (
    <AppShell title="Início">
      <div className="px-6 py-8">
        <p className="text-kami-dark/70">
          Bem-vinda. Use o menu ao lado para acessar as ferramentas do Ecom.
        </p>
      </div>
    </AppShell>
  );
}
