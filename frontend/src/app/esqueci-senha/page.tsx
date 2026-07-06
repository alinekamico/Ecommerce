"use client";

import Link from "next/link";
import { useState } from "react";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const res = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error("Não foi possível processar o pedido");
      setEnviado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-kami-cream px-6">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-kami-dark">Esqueci minha senha</h1>
        <p className="mt-1 text-sm text-kami-dark/70">
          Informe seu e-mail para receber um link de redefinição.
        </p>

        {enviado ? (
          <p className="mt-6 text-sm text-kami-dark">
            Se o e-mail estiver cadastrado, você vai receber um link válido por 30 minutos.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <input
              type="email"
              required
              placeholder="seuemail@kamico.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-kami-gray px-3 py-2 text-kami-dark outline-none focus:border-kami-red"
            />

            {error && <p className="text-sm text-kami-red">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-kami-red px-4 py-2 font-medium text-white transition-colors hover:bg-kami-red-light disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar link"}
            </button>
          </form>
        )}

        <Link
          href="/login"
          className="mt-4 inline-block text-sm text-kami-dark/70 underline hover:text-kami-red"
        >
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
