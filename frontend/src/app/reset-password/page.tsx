"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PasswordInput from "@/components/PasswordInput";

export default function ResetPasswordPage() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (!token) {
      setError("Link inválido.");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const res = await fetch(`${apiUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail ?? "Não foi possível redefinir a senha");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-kami-cream px-6">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-kami-dark">Redefinir senha</h1>

        {done ? (
          <>
            <p className="mt-4 text-sm text-kami-dark">Senha redefinida com sucesso.</p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-md bg-kami-red px-4 py-2 text-sm font-medium text-white hover:bg-kami-red-light"
            >
              Ir para o login
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <PasswordInput
              required
              placeholder="Nova senha"
              value={password}
              onChange={setPassword}
              className="rounded-md border border-kami-gray px-3 py-2 text-kami-dark outline-none focus:border-kami-red"
            />
            <PasswordInput
              required
              placeholder="Confirmar nova senha"
              value={confirmPassword}
              onChange={setConfirmPassword}
              className="rounded-md border border-kami-gray px-3 py-2 text-kami-dark outline-none focus:border-kami-red"
            />

            {error && <p className="text-sm text-kami-red">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-kami-red px-4 py-2 font-medium text-white transition-colors hover:bg-kami-red-light disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Redefinir senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
