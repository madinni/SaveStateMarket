import React from "react";

// Erro de autenticação vindo da API. O 429 (muitas tentativas) ganha destaque de aviso,
// para o usuário entender que precisa esperar e não que a senha está errada.
export default function LoginError({ error }) {
  if (!error) return null;
  if (error.status === 429) {
    return (
      <div role="alert" className="border border-neon-amber/60 bg-noir-950 p-2.5 space-y-1">
        <p className="text-neon-amber font-bold">⚠ ACESSO TEMPORARIAMENTE BLOQUEADO</p>
        <p className="text-slate-300 text-[11px]">{error.message}</p>
      </div>
    );
  }
  return <p role="alert" className="text-neon-pink font-bold">⚠ {error.message}</p>;
}
