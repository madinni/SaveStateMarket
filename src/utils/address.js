export const EMPTY_SHIPPING_ADDRESS = {
  postal_code: "",
  street: "",
  street_verified: false,
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

export function hasShippingAddress(address) {
  return Boolean(
    address?.postal_code &&
      address?.street &&
      address?.number &&
      address?.neighborhood &&
      address?.city &&
      address?.state,
  );
}

export function formatShippingAddress(address) {
  if (!hasShippingAddress(address)) return "Endereço de entrega não informado.";
  const street = `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ""}`;
  return `${street}, ${address.neighborhood}, ${address.city} - ${address.state.toUpperCase()}, CEP ${address.postal_code}`;
}