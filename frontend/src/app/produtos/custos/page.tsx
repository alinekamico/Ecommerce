"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";

type Resultado = {
  sku: string;
  encontrado: boolean;
  marca: string | null;
  descricao: string | null;
  peso: number | null;
  custo: number | null;
  preco_sugerido: number | null;
  custo_medio: number | null;
  estoque_barueri: number | null;
  erro: string | null;
};

function formatNumber(value: number | null) {
  return value === null || value === undefined ? "-" : value.toLocaleString("pt-BR");
}

export default function CustosPage() {
  const [skusText, setSkusText] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const skus = skusText
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (skus.length === 0) {
      setError("Cole ao menos um SKU.");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/tiny/produtos/custos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ skus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail ?? "Nao foi possivel consultar os SKUs");
      }

      const data = await res.json();
      setResultados(data.resultados);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Consulta de custos (Tiny)">
    <div className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm text-kami-dark/70">
          Cole os SKUs (um por linha ou separados por vírgula) para buscar marca, descrição,
          peso, custo, custo médio e estoque em Barueri direto do Tiny.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <textarea
            value={skusText}
            onChange={(e) => setSkusText(e.target.value)}
            rows={5}
            placeholder={"KNK031\nKNK033\nOCK006"}
            className="rounded-md border border-kami-gray bg-white p-3 font-mono text-sm text-kami-dark outline-none focus:border-kami-red"
          />

          {error && <p className="text-sm text-kami-red">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-fit rounded-md bg-kami-red px-5 py-2 font-medium text-white transition-colors hover:bg-kami-red-light disabled:opacity-60"
          >
            {loading ? "Consultando..." : "Consultar"}
          </button>
        </form>

        {resultados.length > 0 && (
          <div className="mt-8 overflow-x-auto rounded-lg border border-kami-gray bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-kami-gray bg-kami-cream text-kami-dark">
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Marca</th>
                  <th className="px-3 py-2">Descrição</th>
                  <th className="px-3 py-2">Peso</th>
                  <th className="px-3 py-2">Custo</th>
                  <th className="px-3 py-2">Preço Sugerido</th>
                  <th className="px-3 py-2">Custo Médio</th>
                  <th className="px-3 py-2">Estoque Barueri</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((r) => (
                  <tr key={r.sku} className="border-b border-kami-gray/50 last:border-0">
                    <td className="px-3 py-2 font-medium text-kami-dark">{r.sku}</td>
                    {r.encontrado ? (
                      <>
                        <td className="px-3 py-2 text-kami-dark">{r.marca ?? "-"}</td>
                        <td className="px-3 py-2 text-kami-dark">{r.descricao ?? "-"}</td>
                        <td className="px-3 py-2 text-kami-dark">{formatNumber(r.peso)}</td>
                        <td className="px-3 py-2 text-kami-dark">{formatNumber(r.custo)}</td>
                        <td className="px-3 py-2 text-kami-dark">{formatNumber(r.preco_sugerido)}</td>
                        <td className="px-3 py-2 text-kami-dark">{formatNumber(r.custo_medio)}</td>
                        <td className="px-3 py-2 text-kami-dark">{formatNumber(r.estoque_barueri)}</td>
                      </>
                    ) : (
                      <td className="px-3 py-2 text-kami-red" colSpan={7}>
                        {r.erro ?? "Nao encontrado"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </AppShell>
  );
}
