"use client";

import { LogOut, Search, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Search;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

function buildNavSections(role: string): NavSection[] {
  const sections: NavSection[] = [
    {
      label: "Ferramentas",
      items: [{ href: "/produtos/custos", label: "Consulta de custos", icon: Search }],
    },
  ];

  if (role === "admin") {
    sections.push({
      label: "Administração",
      items: [{ href: "/admin/usuarios", label: "Usuários do Sistema", icon: Users }],
    });
  }

  return sections;
}

type CurrentUser = {
  name: string;
  role: string;
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  coordenacao: "Coordenação",
  analista: "Analista",
};

export default function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    fetch(`${apiUrl}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error("unauthorized");
        return res.json();
      })
      .then((data) => {
        setUser({ name: data.name, role: data.role });
        setReady(true);
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
      });
  }, []);

  function handleLogout() {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
  }

  if (!ready || !user) return null;

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="flex w-64 flex-shrink-0 flex-col bg-kami-cream">
        <div className="flex items-center gap-3 bg-kami-dark px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-kami-red font-bold text-white">
            K
          </div>
          <div>
            <p className="text-sm font-bold text-white">KAMI CO.</p>
            <p className="text-xs text-white/60">Ecom</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4">
          {buildNavSections(user.role).map((section) => (
            <div key={section.label} className="mb-4">
              <p className="px-2 pb-1 text-xs font-semibold uppercase text-kami-dark/50">
                {section.label}
              </p>
              {section.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`mb-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-kami-red font-medium text-white"
                        : "text-kami-dark hover:bg-kami-dark/5"
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-kami-gray bg-white px-6 py-4">
          <h1 className="text-lg font-bold text-kami-dark">{title}</h1>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-kami-red text-sm font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-sm">
              <p className="font-medium text-kami-dark">{user.name}</p>
              <p className="text-xs text-kami-dark/60">{ROLE_LABELS[user.role] ?? user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sair"
              className="ml-2 text-kami-dark/50 hover:text-kami-red"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 bg-kami-cream">{children}</main>
      </div>
    </div>
  );
}
