import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDeleteProduct } from "../hooks/useProducts";

export default function OwnerActions({ product }) {
  const navigate = useNavigate();
  const deleteProduct = useDeleteProduct();
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!window.confirm(`Excluir o anúncio "${product.title}"? Esta ação não pode ser desfeita.`)) return;
    setError("");
    try {
      await deleteProduct.mutateAsync(product.id);
      navigate("/");
    } catch (err) {
      setError(err.message || "Não foi possível excluir o anúncio.");
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <Link
          to={`/sell/${product.id}/edit`}
          className="py-3 bg-noir-800 border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 font-black text-xs uppercase chamfer-box tracking-wider text-center"
        >
          EDITAR ANÚNCIO
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteProduct.isPending}
          className="py-3 bg-noir-800 border-2 border-neon-pink text-neon-pink hover:bg-neon-pink/10 font-black text-xs uppercase chamfer-box tracking-wider disabled:opacity-50"
        >
          {deleteProduct.isPending ? "EXCLUINDO..." : "EXCLUIR ANÚNCIO"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-[11px] text-neon-pink font-bold">⚠ {error}</p>
      )}
    </div>
  );
}
