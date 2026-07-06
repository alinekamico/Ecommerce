"use client";

import Link from "next/link";
import { useState } from "react";
import PasswordInput from "@/components/PasswordInput";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail ?? "Nao foi possivel entrar");
      }

      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-kami-cream px-6">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-kami-dark">Entrar</h1>
        <p className="mt-1 text-sm text-kami-dark/70">
          Acesse sua conta KAMI CO.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-kami-dark">
            E-mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-kami-gray px-3 py-2 text-kami-dark outline-none focus:border-kami-red"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-kami-dark">
            Senha
            <PasswordInput
              required
              value={password}
              onChange={setPassword}
              className="rounded-md border border-kami-gray px-3 py-2 text-kami-dark outline-none focus:border-kami-red"
            />
          </label>

          {error && <p className="text-sm text-kami-red">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-md bg-kami-red px-4 py-2 font-medium text-white transition-colors hover:bg-kami-red-light disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <Link
          href="/esqueci-senha"
          className="mt-4 inline-block text-sm text-kami-dark/70 underline hover:text-kami-red"
        >
          Esqueci minha senha
        </Link>
      </div>
    </div>
  );
}
