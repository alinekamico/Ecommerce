"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import PasswordInput from "@/components/PasswordInput";

type Usuario = {
  id: number;
  name: string;
  email: string;
  department: string;
  role: "admin" | "coordenacao" | "analista";
  is_active: boolean;
};

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  };
}

function apiUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

const ROLE_LABELS: Record<Usuario["role"], string> = {
  admin: "Admin",
  coordenacao: "Coordenação",
  analista: "Analista",
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    password: "",
    role: "analista",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadUsuarios() {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl()}/auth/users`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Nao foi possivel carregar os usuarios");
      setUsuarios(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsuarios();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      const res = await fetch(`${apiUrl()}/auth/users`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail ?? "Nao foi possivel criar o usuario");
      }

      setForm({ name: "", email: "", department: "", password: "", role: "analista" });
      await loadUsuarios();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Usuários do Sistema">
      <div className="px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="overflow-x-auto rounded-lg border border-kami-gray bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-kami-gray bg-kami-cream text-kami-dark">
                    <th className="px-3 py-2">Nome</th>
                    <th className="px-3 py-2">E-mail</th>
                    <th className="px-3 py-2">Departamento</th>
                    <th className="px-3 py-2">Perfil</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id} className="border-b border-kami-gray/50 last:border-0">
                      <td className="px-3 py-2 font-medium text-kami-dark">{u.name}</td>
                      <td className="px-3 py-2 text-kami-dark">{u.email}</td>
                      <td className="px-3 py-2 text-kami-dark">{u.department}</td>
                      <td className="px-3 py-2 text-kami-dark">{ROLE_LABELS[u.role]}</td>
                      <td className="px-3 py-2">
                        {u.is_active ? (
                          <span className="text-green-700">Ativo</span>
                        ) : (
                          <span className="text-kami-red">Inativo</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {loading && <p className="mt-3 text-sm text-kami-dark/60">Carregando...</p>}
            {error && <p className="mt-3 text-sm text-kami-red">{error}</p>}
          </div>

          <div>
            <div className="rounded-lg border border-kami-gray bg-white p-5">
              <h2 className="font-semibold text-kami-dark">Novo usuário</h2>
              <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-3">
                <input
                  required
                  placeholder="Nome"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="rounded-md border border-kami-gray px-3 py-2 text-sm text-kami-dark outline-none focus:border-kami-red"
                />
                <input
                  required
                  type="email"
                  placeholder="E-mail"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="rounded-md border border-kami-gray px-3 py-2 text-sm text-kami-dark outline-none focus:border-kami-red"
                />
                <input
                  required
                  placeholder="Departamento"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="rounded-md border border-kami-gray px-3 py-2 text-sm text-kami-dark outline-none focus:border-kami-red"
                />
                <PasswordInput
                  required
                  placeholder="Senha provisória"
                  value={form.password}
                  onChange={(value) => setForm({ ...form, password: value })}
                  className="rounded-md border border-kami-gray px-3 py-2 text-sm text-kami-dark outline-none focus:border-kami-red"
                />
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="rounded-md border border-kami-gray px-3 py-2 text-sm text-kami-dark outline-none focus:border-kami-red"
                >
                  <option value="analista">Analista (visualização)</option>
                  <option value="coordenacao">Coordenação (edição)</option>
                  <option value="admin">Admin (TI)</option>
                </select>

                {formError && <p className="text-sm text-kami-red">{formError}</p>}

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-kami-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-kami-red-light disabled:opacity-60"
                >
                  {saving ? "Salvando..." : "Criar usuário"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
