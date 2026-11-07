import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useUnreadCount } from "../hooks/useNotifications";

// Fonte única dos itens de navegação principal: a Navbar (barra inferior, abaixo de lg)
// e a DesktopNav (topo, lg+) leem daqui para não divergirem.
// `badge`: qual contador mostrar ("cart" | "unread"). `highlight`: botão de destaque (+VENDER).
// `adminOnly`: só aparece para `user.role === "admin"`.
export const NAV_ITEMS = [
  { to: "/", end: true, icon: "■", label: "INÍCIO" },
  { to: "/offers", icon: "◈", label: "OFERTAS" },
  { to: "/checkout", icon: "▣", label: "CARRINHO", badge: "cart" },
  { to: "/sell", label: "+VENDER", highlight: true },
  { to: "/notifications", icon: "◆", label: "ALERTAS", badge: "unread" },
  { to: "/help", icon: "?", label: "AJUDA" },
  { to: "/admin", icon: "#", label: "ADMIN", adminOnly: true },
  { to: "/profile", icon: "◉", label: "PERFIL" },
];

// Itens visíveis para o usuário atual, já com o valor do contador e o rótulo acessível.
export function useNavItems() {
  const { itemCount } = useCart();
  const { user } = useAuth();
  const unread = useUnreadCount(user?.id);

  return NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === "admin").map((item) => {
    const count = item.badge === "cart" ? itemCount : item.badge === "unread" ? unread : 0;
    let ariaLabel;
    if (item.badge === "cart" && count > 0) ariaLabel = `Carrinho (${count} itens)`;
    if (item.badge === "unread") ariaLabel = count > 0 ? `Alertas (${count} não lidas)` : "Alertas";
    return { ...item, count, ariaLabel };
  });
}
