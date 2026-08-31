"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { logout as logoutRequest } from "../../lib/api/auth";

export default function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await logoutRequest();
    } finally {
      queryClient.removeQueries({ queryKey: ["auth"] });
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-[var(--danger)] disabled:opacity-60"
      onClick={logout}
      disabled={loading}
    >
      {loading ? "Cerrando..." : "Cerrar sesión"}
    </button>
  );
}
