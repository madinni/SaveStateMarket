import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Telas do administrador. Sem login → /entrar; logado sem role "admin" → início.
// É só conveniência de navegação: a API responde 401/403 nas rotas /admin/*.
export default function RequireAdmin({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/entrar" replace state={{ from: location }} />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}
