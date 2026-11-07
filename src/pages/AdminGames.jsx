import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "../components/Header";
import AdminTabs from "../components/AdminTabs";
import FieldError from "../components/FieldError";
import { PLATFORMS } from "../schemas";
import { useGames, useCreateGame, useUpdateGame, useDeleteGame } from "../hooks/useGames";

const formSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "O título deve ter pelo menos 2 caracteres.")
    .max(120, "O título deve ter no máximo 120 caracteres."),
  platform: z.enum(PLATFORMS.map((p) => p.value), { error: "Selecione uma plataforma." }),
  region: z.string().trim().min(2, "Informe a região.").max(20, "Máximo de 20 caracteres."),
  cover_url: z
    .string()
    .trim()
    .refine((v) => v === "" || /^(https?:\/\/|data:image\/)/i.test(v), "Use uma URL http(s) válida."),
});

const EMPTY = { title: "", platform: PLATFORMS[0].value, region: "NTSC-U", cover_url: "" };

const field =
  "w-full bg-noir-950 border-2 border-slate-600 p-2 text-slate-100 text-xs focus:outline-none focus:border-neon-cyan";

const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

export default function AdminGames() {
  const { data: games = [], isLoading, isError, error } = useGames();
  const createGame = useCreateGame();
  const updateGame = useUpdateGame();
  const deleteGame = useDeleteGame();

  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(formSchema), defaultValues: EMPTY });

  const coverPreview = watch("cover_url");

  // A mensagem aparece no topo (junto do formulário): leva a tela até lá para o erro não passar batido.
  const showError = (text) => {
    setMessage({ type: "error", text });
    scrollToTop();
  };

  const startEdit = (game) => {
    setEditing(game);
    setMessage({ type: "", text: "" });
    reset({
      title: game.title,
      platform: game.platform,
      region: game.region || "NTSC-U",
      cover_url: game.cover_url || "",
    });
    scrollToTop();
  };

  const cancelEdit = () => {
    setEditing(null);
    reset(EMPTY);
  };

  const onSubmit = async (values) => {
    setMessage({ type: "", text: "" });
    try {
      if (editing) {
        await updateGame.mutateAsync({ id: editing.id, data: values });
        setMessage({ type: "ok", text: "Jogo atualizado." });
      } else {
        await createGame.mutateAsync(values);
        setMessage({ type: "ok", text: "Jogo cadastrado no catálogo." });
      }
      setEditing(null);
      reset(EMPTY);
    } catch (err) {
      // Erro de um campo (ex.: 409 de jogo duplicado) aparece junto do campo.
      if (err.field && err.field in EMPTY) setError(err.field, { message: err.message });
      else showError(err.message || "Não foi possível salvar o jogo.");
    }
  };

  const onDelete = async (game) => {
    if (!window.confirm(`Excluir "${game.title}" (${game.platform}) do catálogo?`)) return;
    setMessage({ type: "", text: "" });
    try {
      await deleteGame.mutateAsync(game.id);
      if (editing?.id === game.id) cancelEdit();
      setMessage({ type: "ok", text: `"${game.title}" removido do catálogo.` });
    } catch (err) {
      showError(err.message || "Não foi possível excluir o jogo.");
    }
  };

  const term = search.trim().toLowerCase();
  const visible = games.filter(
    (g) => !term || g.title.toLowerCase().includes(term) || g.platform.toLowerCase().includes(term),
  );

  return (
    <div className="min-h-screen pb-28 text-slate-100 bg-noir-950 font-code">
      <Header
        title="NULL"
        titleHighlight="CATALOG"
        subtitle="CONSOLE DO ADMINISTRADOR // JOGO BASE"
        backLink="/admin"
        badgeText="ROOT"
        badgeType="pink"
      />
      <main className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <AdminTabs />

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="bg-noir-900 border border-slate-700 p-3 chamfer-box space-y-3 text-xs"
        >
          <h2 className="font-black text-neon-cyan uppercase tracking-wider">
            {editing ? `// EDITAR: ${editing.title}` : "// NOVO JOGO NO CATÁLOGO"}
          </h2>

          <div>
            <label htmlFor="game-title" className="block text-[10px] text-slate-400 mb-1">TÍTULO</label>
            <input id="game-title" type="text" placeholder="Ex: Chrono Trigger" {...register("title")} className={field} />
            <FieldError error={errors.title} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="game-platform" className="block text-[10px] text-slate-400 mb-1">PLATAFORMA</label>
              <select id="game-platform" {...register("platform")} className={field}>
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <FieldError error={errors.platform} />
            </div>
            <div>
              <label htmlFor="game-region" className="block text-[10px] text-slate-400 mb-1">REGIÃO</label>
              <input id="game-region" type="text" placeholder="NTSC-U" {...register("region")} className={field} />
              <FieldError error={errors.region} />
            </div>
          </div>

          <div>
            <label htmlFor="game-cover" className="block text-[10px] text-slate-400 mb-1">URL DA CAPA</label>
            <input id="game-cover" type="text" placeholder="https://..." {...register("cover_url")} className={field} />
            <FieldError error={errors.cover_url} />
            {coverPreview && /^(https?:\/\/|data:image\/)/i.test(coverPreview) && (
              <img src={coverPreview} alt="Prévia da capa" className="mt-2 h-24 w-auto border border-noir-700 object-cover" />
            )}
          </div>

          {message.text && (
            <p
              role={message.type === "error" ? "alert" : "status"}
              className={`text-[11px] font-bold ${message.type === "error" ? "text-neon-pink" : "text-neon-mint"}`}
            >
              {message.type === "error" ? "⚠ " : "✓ "}
              {message.text}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-10 bg-neon-cyan text-noir-950 font-black chamfer-tag text-[10px] tracking-wider disabled:opacity-40"
            >
              {isSubmitting ? "SALVANDO..." : editing ? "SALVAR >>" : "CADASTRAR >>"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 h-10 bg-noir-800 border border-slate-600 text-slate-300 font-bold chamfer-tag text-[10px]"
              >
                CANCELAR
              </button>
            )}
          </div>
        </form>

        <section className="space-y-2">
          <div className="flex justify-between items-center border-b border-noir-800 pb-1 text-xs font-bold text-white">
            <span>CATÁLOGO ({games.length})</span>
          </div>
          <input
            type="text"
            aria-label="Buscar no catálogo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="BUSCAR_TÍTULO || PLATAFORMA..."
            className={field}
          />

          {isLoading ? (
            <p className="text-xs text-neon-cyan animate-pulse">CARREGANDO_CATÁLOGO...</p>
          ) : isError ? (
            <p role="alert" className="text-xs font-bold text-neon-pink">⚠ {error.message}</p>
          ) : visible.length === 0 ? (
            <p className="text-xs text-slate-500 bg-noir-900/40 border border-dashed border-noir-800 p-4 text-center">
              NENHUM JOGO ENCONTRADO.
            </p>
          ) : (
            visible.map((game) => (
              <div
                key={game.id}
                className={`bg-noir-900 border p-2.5 flex items-center justify-between gap-2 ${
                  editing?.id === game.id ? "border-neon-cyan" : "border-noir-800"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-noir-800 border border-noir-700 shrink-0 overflow-hidden">
                    {game.cover_url && (
                      <img src={game.cover_url} alt="" className="w-full h-full object-cover grayscale" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-white truncate uppercase">{game.title}</h3>
                    <p className="text-[10px] text-slate-500">
                      {game.platform} // {game.region || "NTSC-U"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(game)}
                    className="px-2 py-1 bg-noir-800 border border-neon-cyan text-neon-cyan text-[10px] font-bold chamfer-tag hover:bg-neon-cyan/10"
                  >
                    [EDITAR]
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(game)}
                    disabled={deleteGame.isPending}
                    className="px-2 py-1 bg-noir-800 border border-neon-pink text-neon-pink text-[10px] font-bold chamfer-tag hover:bg-neon-pink/10 disabled:opacity-50"
                  >
                    [EXCLUIR]
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}