import React, { useState, useEffect } from "react";
import { useSearchParams, Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../hooks/useProducts";
import { useProfiles, useReviews, useSaveReview } from "../hooks/useProfiles";
import { reviewSchema } from "../schemas";
import FieldError from "../components/FieldError";

const normalize = (v) =>
  v ? decodeURIComponent(String(v)).replace(/[@\s]/g, "").toLowerCase() : "";

const formatBRL = (val) =>
  Number(val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=200&q=80";

function resizeAvatar(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Arquivo de imagem inválido."));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 200;
        canvas.height = 200;
        const size = Math.min(img.width, img.height);
        canvas
          .getContext("2d")
          .drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 200, 200);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function OperativeProfile() {
  const [searchParams] = useSearchParams();
  const { user, logout, updateAvatar } = useAuth();
  const [feedback, setFeedback] = useState("");
  const [avatarError, setAvatarError] = useState("");

  const targetHandle = searchParams.get("handle");
  const clean = normalize(targetHandle || user?.handle);
  const isOwnProfile =
    !targetHandle || (user && normalize(user.handle) === normalize(targetHandle));

  const { data: profiles, isLoading: loadingProfiles, isError } = useProfiles();
  const { data: products = [] } = useProducts();
  const profile = profiles?.find((p) => normalize(p.handle) === clean);
  const { data: reviews = [] } = useReviews(profile?.id);
  const saveReview = useSaveReview(profile?.id);

  const myReview = user
    ? reviews.find((r) => normalize(r.author_handle) === normalize(user.handle))
    : null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: { comment: "", rating: 5 },
  });

  // Ao existir uma avaliação do usuário, o formulário entra em modo de edição.
  useEffect(() => {
    reset({ comment: myReview?.comment ?? "", rating: myReview?.rating ?? 5 });
  }, [myReview?.id, myReview?.comment, myReview?.rating, reset]);

  if (!targetHandle && !user) return <Navigate to="/login" replace />;

  if (loadingProfiles) {
    return <div className="p-10 text-center font-code text-neon-cyan animate-pulse">SYNCING_OPERATIVE_DOSSIER...</div>;
  }
  if (isError) {
    return <div role="alert" className="p-10 text-center font-code text-neon-pink font-bold">⚠ FALHA AO CARREGAR O DOSSIÊ.</div>;
  }
  if (!profile) {
    return (
      <div className="p-10 text-center font-code text-neon-pink space-y-3">
        <p className="font-bold">⚠ OPERADOR NÃO ENCONTRADO.</p>
        <Link to="/" className="text-neon-cyan underline">&lt;&lt; VOLTAR AO FEED</Link>
      </div>
    );
  }

  const userProducts = products.filter((p) => normalize(p.seller_handle) === clean);
  const avatarSrc = (isOwnProfile && user?.avatar_url) || profile.avatar_url || DEFAULT_AVATAR;

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAvatarError("");
      await updateAvatar(await resizeAvatar(file));
    } catch (err) {
      setAvatarError(err.message);
    }
  };

  const onSubmitReview = async (values) => {
    setFeedback("");
    try {
      await saveReview.mutateAsync({
        id: myReview?.id,
        data: {
          profile_id: profile.id,
          author_handle: user.handle,
          rating: values.rating,
          comment: values.comment,
          badge: myReview ? "[UPDATED_REVIEW]" : "[VERIFIED_TRADE]",
          created_at: new Date().toISOString(),
        },
      });
      setFeedback("Feedback registrado com sucesso.");
    } catch {
      /* o erro é exibido via saveReview.isError */
    }
  };

  return (
    <div className="min-h-screen pb-24 text-slate-200">
      <header className="sticky top-0 z-40 bg-noir-950/85 backdrop-blur-md border-b border-noir-700/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 bg-neon-mint animate-pulse"></div>
          <div>
            <h1 className="font-pixel text-2xl tracking-widest text-white leading-none">
              DOSSIER<span className="text-neon-cyan">//</span>{normalize(profile.handle).slice(0, 4).toUpperCase()}
            </h1>
            <p className="font-code text-[9px] text-slate-400">OPERATIVE_RECORD // {profile.clearance_level || "LEVEL_3"}</p>
          </div>
        </div>
        {isOwnProfile ? (
          <button type="button" onClick={logout} className="px-2 py-1 bg-noir-900 border border-noir-700 text-slate-400 hover:text-neon-pink hover:border-neon-pink text-[10px] font-code chamfer-tag">
            [LOGOUT]
          </button>
        ) : (
          <Link to="/" className="px-2 py-1 bg-noir-900 border border-noir-700 text-neon-cyan text-[10px] font-code chamfer-tag">
            &lt;&lt; FEED
          </Link>
        )}
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        <section className="bg-noir-900/90 border border-noir-700 p-4 chamfer-box glow-pink">
          <div className="flex items-center space-x-3.5">
            <div className="relative group">
              <input type="file" id="avatar-input" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <div
                onClick={() => isOwnProfile && document.getElementById("avatar-input").click()}
                className={`w-16 h-16 bg-noir-800 border-2 border-neon-pink p-0.5 overflow-hidden chamfer-tag relative ${isOwnProfile ? "cursor-pointer" : ""}`}
              >
                <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover grayscale contrast-150" />
                {isOwnProfile && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-noir-950/80 text-[8px] font-code text-neon-cyan font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>[EDIT]</span>
                    <span>PHOTO</span>
                  </div>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-neon-mint border-2 border-noir-950"></span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white font-code truncate">{profile.handle}</h2>
                <span className="text-[9px] font-code text-neon-cyan bg-noir-950 px-1.5 py-0.5 border border-neon-cyan/40">
                  {isOwnProfile ? "VERIFIED" : "SELLER"}
                </span>
              </div>
              <p className="text-[10px] font-code text-slate-400 mt-0.5">ID: 0x{String(profile.id).slice(0, 8).toUpperCase()}</p>
              <p className="text-[10px] font-code text-neon-mint mt-1">
                REPUTATION: ★ {Number(profile.reputation ?? 5).toFixed(2)} ({profile.total_transactions || 0} TRANSACTIONS)
              </p>
            </div>
          </div>
          {avatarError && <p role="alert" className="mt-2 text-[10px] font-bold text-neon-pink">⚠ {avatarError}</p>}

          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-noir-800 text-center font-code">
            <div className="bg-noir-950 p-2 border border-noir-800/80">
              <span className="text-[8px] text-slate-500 block">SUCCESS_RATE</span>
              <span className="font-bold text-neon-mint font-pixel text-lg leading-none">{profile.success_rate ?? 100}%</span>
            </div>
            <div className="bg-noir-950 p-2 border border-noir-800/80">
              <span className="text-[8px] text-slate-500 block">ACTIVE_DROPS</span>
              <span className="font-bold text-neon-cyan font-pixel text-lg leading-none">{String(userProducts.length).padStart(2, "0")}</span>
            </div>
            <div className="bg-noir-950 p-2 border border-noir-800/80">
              <span className="text-[8px] text-slate-500 block">VAULT_BALANCE</span>
              <span className="font-bold text-neon-pink font-pixel text-lg leading-none">{formatBRL(profile.vault_balance).split(",")[0]}</span>
            </div>
          </div>
        </section>

        {isOwnProfile && (
          <section className="bg-noir-900 border border-neon-cyan/40 p-3 chamfer-box flex justify-between items-center glow-cyan">
            <div>
              <span className="text-[9px] font-code text-neon-cyan block">NULL_ESCROW // CARTEIRA</span>
              <p className="text-base font-pixel text-white leading-none mt-0.5">
                {formatBRL(profile.vault_balance)} <span className="text-[10px] text-slate-400 font-code font-normal">EM CUSTÓDIA</span>
              </p>
            </div>
            <button type="button" onClick={() => alert("Saque PIX autorizado.")} className="px-3 py-1.5 bg-noir-800 hover:bg-neon-cyan hover:text-noir-950 text-neon-cyan border border-neon-cyan text-[10px] font-code font-bold chamfer-tag">
              [SACAR_SALDO]
            </button>
          </section>
        )}

        <section className="space-y-2">
          <div className="flex border-b border-noir-800 pb-1 text-xs font-code text-white font-bold">
            <span>ANÚNCIOS REGISTRADOS ({userProducts.length})</span>
          </div>
          {userProducts.length === 0 ? (
            <div className="bg-noir-900 border border-noir-800 p-4 text-center font-code text-xs text-slate-500">
              NENHUM ITEM PUBLICADO POR ESTE OPERADOR.
            </div>
          ) : (
            userProducts.map((p) => (
              <Link to={`/product/${p.id}`} key={p.id} className="bg-noir-900 border border-noir-800 p-2.5 flex items-center justify-between hover:border-neon-pink transition-colors block">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 bg-noir-800 border border-noir-700 shrink-0 overflow-hidden">
                    <img src={p.image_url} alt="" className="w-full h-full object-cover filter grayscale" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-white font-code truncate uppercase">{p.title}</h3>
                    <p className="text-[10px] text-slate-500 font-code">{p.platform} // {p.condition_tag}</p>
                  </div>
                </div>
                <p className="font-pixel text-neon-cyan text-lg">{formatBRL(p.price)}</p>
              </Link>
            ))
          )}
        </section>

        {!isOwnProfile &&
          (user ? (
            <section className="bg-noir-900/90 border border-noir-700 p-3.5 chamfer-box space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-code text-neon-cyan font-bold">
                  {myReview ? "ALTERAR SEU FEEDBACK" : "REGISTRAR FEEDBACK NO DOSSIÊ"}
                </span>
                <span className="text-[9px] font-code text-slate-500">{myReview ? "EDIT_MODE" : "NEW_ENTRY"}</span>
              </div>
              <form onSubmit={handleSubmit(onSubmitReview)} noValidate className="space-y-2">
                <div>
                  <textarea
                    rows="2"
                    aria-label="Comentário"
                    placeholder="Relate a experiência da negociação..."
                    {...register("comment")}
                    className="w-full bg-noir-950 border border-noir-700 px-3 py-2 text-xs font-code text-white placeholder-slate-600 focus:outline-none focus:border-neon-pink resize-none"
                  />
                  <FieldError error={errors.comment} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <label htmlFor="review-rating" className="text-[10px] font-code text-slate-400">NOTA:</label>
                    <select id="review-rating" {...register("rating")} className="bg-noir-950 border border-noir-700 text-neon-mint text-xs font-code px-2 py-1">
                      <option value="5">★ ★ ★ ★ ★ (5.0)</option>
                      <option value="4">★ ★ ★ ★ ☆ (4.0)</option>
                      <option value="3">★ ★ ★ ☆ ☆ (3.0)</option>
                      <option value="2">★ ★ ☆ ☆ ☆ (2.0)</option>
                      <option value="1">★ ☆ ☆ ☆ ☆ (1.0)</option>
                    </select>
                  </div>
                  <button type="submit" disabled={saveReview.isPending} className="py-1.5 px-4 bg-neon-pink text-white font-code text-xs font-bold chamfer-tag glow-pink disabled:opacity-50">
                    {saveReview.isPending ? "GRAVANDO..." : myReview ? "[ATUALIZAR_LOG]" : "[GRAVAR_LOG]"}
                  </button>
                </div>
                {saveReview.isError && <p role="alert" className="text-[11px] font-bold text-neon-pink">⚠ {saveReview.error.message}</p>}
                {feedback && <p role="status" className="text-[11px] font-bold text-neon-mint">✓ {feedback}</p>}
              </form>
            </section>
          ) : (
            <div className="bg-noir-900/90 border border-noir-700 p-4 chamfer-box text-center space-y-2">
              <p className="text-[11px] font-code text-neon-amber font-bold">CLEARANCE_REQUIRED // ACESSO RESTRITO</p>
              <p className="text-[10px] font-code text-slate-400">Faça login para registrar feedback neste dossiê.</p>
              <Link to="/login" className="inline-block px-3 py-1.5 bg-neon-cyan text-noir-950 font-code text-xs font-bold chamfer-tag">
                [AUTORIZAR_ACESSO]
              </Link>
            </div>
          ))}

        <section className="space-y-2">
          <div className="flex justify-between items-center border-b border-noir-800 pb-1 text-xs font-code text-white font-bold">
            <span>REPUTATION_LOGS ({reviews.length})</span>
          </div>
          {reviews.length === 0 ? (
            <div className="bg-noir-900 border border-noir-800 p-4 text-center font-code text-xs text-slate-500">
              NENHUM FEEDBACK REGISTRADO AINDA.
            </div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="bg-noir-900 border border-noir-800 p-3 chamfer-box space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-code">
                  <span className="text-white font-bold">{r.author_handle}</span>
                  <span className="text-neon-mint">{"★".repeat(r.rating || 5)}</span>
                </div>
                <p className="text-xs font-code text-slate-300 bg-noir-950 p-2 border border-noir-800/60 leading-relaxed">
                  "{r.comment}"
                </p>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
