// Avisos rápidos (toasts) do grupo. O <ToastContainer> fica uma única vez em App.jsx.
// Use como complemento dos erros inline (FieldError / role="alert"), não no lugar deles.
//
//   import { notify } from "../utils/toast";
//   notify.success("Anúncio publicado.");
//   notify.error(err.message);
//   notify.info("Copiado para a área de transferência.");
//   notify.warning("Conta bloqueada para compras.");
import { toast } from "react-toastify";

// Mensagem padrão quando o erro não traz texto (ex.: falha de rede inesperada).
const FALLBACK_ERROR = "Algo deu errado. Tente novamente.";

export const notify = {
  success: (message, options) => toast.success(message, options),
  error: (messageOrError, options) =>
    toast.error(
      typeof messageOrError === "string" ? messageOrError : messageOrError?.message || FALLBACK_ERROR,
      options,
    ),
  info: (message, options) => toast.info(message, options),
  warning: (message, options) => toast.warning(message, options),
};

export default notify;
