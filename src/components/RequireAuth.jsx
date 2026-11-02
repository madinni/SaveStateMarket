import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Aula 11: rota do React que exige o token. Sem token → /entrar.
// Esconder a tela não protege nada sozinho: a API também responde 401.
export default function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/entrar" replace state={{ from: location }} />;
  return children;
}
