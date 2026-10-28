import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../context/AuthContext";
import { useProduct, useCreateProduct, useUpdateProduct } from "../hooks/useProducts";
import { productSchema, PLATFORMS } from "../schemas";
import FieldError from "../components/FieldError";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80";

const buildConditionTag = ({ is_functional, has_box }) => {
  if (!is_functional) return "[DEFECTIVE]";
  return has_box ? "[CIB // 9.5]" : "[USED]";
};

// Recorta ao centro (cover) em 600x400 sem distorcer a imagem original.
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Arquivo de imagem inválido."));
      img.onload = () => {
        const W = 600;
        const H = 400;
        const scale = Math.max(W / img.width, H / img.height);
        const sw = W / scale;
        const sh = H / scale;
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        canvas
          .getContext("2d")
          .drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, W, H);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function DropAsset() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [previewImg, setPreviewImg] = useState(null);
  const [submitError, setSubmitError] = useState("");

  const { data: product, isLoading: loadingProduct, isError: productError } = useProduct(id);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      platform: PLATFORMS[0].value,
      price: "",
      has_box: true,
      has_manual: true,
      is_functional: true,
    },
  });

  // Preenche o formulário ao editar um anúncio existente.
  useEffect(() => {
    if (!product) return;
    reset({
      title: product.title,
      platform: product.platform,
      price: product.price,
      has_box: Boolean(product.has_box),
      has_manual: Boolean(product.has_manual),
      is_functional: product.is_functional !== false,
    });
    setPreviewImg(product.image_url || null);
  }, [product, reset]);

  if (!user) return <Navigate to="/login" replace />;

  const isOwner =
    !product ||
    String(product.seller_id) === String(user.id) ||
    product.seller_handle === user.handle;

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPreviewImg(await resizeImage(file));
      setSubmitError("");
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  const onSubmit = async (values) => {
    setSubmitError("");
    const payload = {
      ...values,
      condition_tag: buildConditionTag(values),
      image_url: previewImg || DEFAULT_IMAGE,
    };

    try {
      if (isEdit) {
        await updateProduct.mutateAsync({ id, data: payload });
        navigate(`/product/${id}`);
      } else {
        await createProduct.mutateAsync({
          ...payload,
          seller_handle: user.handle,
          seller_id: user.id,
          created_at: new Date().toISOString(),
        });
        navigate("/");
      }
    } catch (err) {
      setSubmitError(err.message || "Falha na transmissão do ativo.");
    }
  };

  if (isEdit && loadingProduct) {
    return <div className="p-10 text-center font-code text-neon-cyan animate-pulse">CARREGANDO_ANÚNCIO...</div>;
  }
  if (isEdit && (productError || !product)) {
    return <div className="p-10 text-center font-code text-neon-pink">⚠ ANÚNCIO NÃO ENCONTRADO.</div>;
  }
  if (isEdit && !isOwner) {
    return (
      <div className="p-10 text-center font-code text-neon-pink space-y-3">
        <p>⚠ APENAS O ANUNCIANTE PODE EDITAR ESTE ANÚNCIO.</p>
        <Link to={`/product/${id}`} className="text-neon-cyan underline">&lt;&lt; VOLTAR</Link>
      </div>
    );
  }

  const field = "w-full bg-noir-900 border border-noir-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-neon-pink";

  return (
    <div className="min-h-screen pb-28 text-slate-200">
      <header className="sticky top-0 z-40 bg-noir-950/90 backdrop-blur-md border-b border-noir-700/70 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to={isEdit ? `/product/${id}` : "/"} className="text-neon-cyan hover:text-white text-xs font-code">[ESC]</Link>
          <div className="h-4 w-px bg-noir-700"></div>
          <h1 className="font-pixel text-xl tracking-widest text-white leading-none">
            {isEdit ? "EDIT" : "UPLOAD"}<span className="text-neon-pink">//</span>ASSET
          </h1>
        </div>
        <span className="font-code text-[10px] text-neon-mint border border-neon-mint/30 px-2 py-0.5 chamfer-tag bg-noir-900">
          SEC_LVL: 04
        </span>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4 font-code">
        <div className="bg-noir-900/80 border border-noir-700 p-2.5 chamfer-box flex items-center space-x-2 text-xs">
          <span className="w-2 h-2 bg-neon-mint animate-pulse"></span>
          <span className="text-slate-400">VENDEDOR:</span>
          <span className="text-neon-cyan font-bold">{user.handle}</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label className="block text-[11px] text-slate-400 uppercase mb-1">[01] Registro Visual da Mídia</label>
            <input type="file" id="asset-photo" accept="image/*" className="hidden" onChange={handleImage} />
            <div
              onClick={() => document.getElementById("asset-photo").click()}
              className="w-full aspect-[16/9] border-2 border-dashed border-noir-700 hover:border-neon-pink bg-noir-900/60 chamfer-box flex items-center justify-center cursor-pointer overflow-hidden"
            >
              {previewImg ? (
                <img src={previewImg} alt="Preview" className="w-full h-full object-cover grayscale contrast-125" />
              ) : (
                <div className="text-center">
                  <p className="text-xs text-white font-bold">+ UPLOAD_RAW_SNAP</p>
                  <p className="text-[9px] text-slate-500">TOQUE PARA SELECIONAR FOTO</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="asset-title" className="block text-[11px] text-slate-400 uppercase mb-1">[02] Título do Jogo</label>
            <input id="asset-title" type="text" placeholder="Ex: Super Mario World" {...register("title")} className={field} />
            <FieldError error={errors.title} />
          </div>

          <div>
            <label htmlFor="asset-platform" className="block text-[11px] text-slate-400 uppercase mb-1">[03] Plataforma</label>
            <select id="asset-platform" {...register("platform")} className={field}>
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <FieldError error={errors.platform} />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <label className="flex items-center space-x-2 bg-noir-900 border border-noir-700 p-2 cursor-pointer">
              <input type="checkbox" {...register("has_box")} className="accent-neon-pink" />
              <span>Caixa Original</span>
            </label>
            <label className="flex items-center space-x-2 bg-noir-900 border border-noir-700 p-2 cursor-pointer">
              <input type="checkbox" {...register("has_manual")} className="accent-neon-pink" />
              <span>Manual Incluso</span>
            </label>
            <label className="flex items-center space-x-2 bg-noir-900 border border-neon-mint/60 p-2 cursor-pointer col-span-2">
              <input type="checkbox" {...register("is_functional")} className="accent-neon-mint" />
              <span className="text-neon-mint font-bold">✓ MÍDIA TESTADA & 100% OPERACIONAL</span>
            </label>
          </div>

          <div>
            <label htmlFor="asset-price" className="block text-[11px] text-slate-400 uppercase mb-1">[04] Preço Solicitado (R$)</label>
            <input id="asset-price" type="number" step="0.01" min="0" placeholder="0.00" {...register("price")}
              className={`${field} font-pixel text-2xl`} />
            <FieldError error={errors.price} />
          </div>

          {submitError && (
            <div role="alert" className="bg-noir-900 border-2 border-neon-pink p-3 chamfer-box text-xs text-neon-pink font-bold">
              ⚠ {submitError}
            </div>
          )}

          <button type="submit" disabled={isSubmitting}
            className="w-full bg-neon-pink hover:bg-neon-pink/90 text-white font-bold py-3 text-xs uppercase chamfer-box glow-pink tracking-widest disabled:opacity-50">
            {isSubmitting ? "TRANSMITINDO..." : isEdit ? "SALVAR_ALTERAÇÕES >>" : "TRANSMIT_TO_NETWORK >>"}
          </button>
        </form>
      </main>
    </div>
  );
}
