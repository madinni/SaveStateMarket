// PIX copia e cola SIMULADO (formato EMV com CRC16). Não recebe pagamentos reais.
// Portado de src/utils/pix.js para que o código seja gerado pelo servidor.
const field = (id, value) => {
  const text = String(value);
  return `${id}${String(text.length).padStart(2, "0")}${text}`;
};

const crc16 = (value) => {
  let crc = 0xffff;
  for (let index = 0; index < value.length; index += 1) {
    crc ^= value.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
};

export function createDemoPixPayload(amount, orderId) {
  const transactionId = String(orderId).replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 25);
  const merchantAccount = field("00", "br.gov.bcb.pix") + field("01", "checkout@savestatemarket.invalid");
  const payload = [
    field("00", "01"),
    field("01", "12"),
    field("26", merchantAccount),
    field("52", "0000"),
    field("53", "986"),
    field("54", Number(amount).toFixed(2)),
    field("58", "BR"),
    field("59", "SAVESTATE MARKET"),
    field("60", "SAO PAULO"),
    field("62", field("05", transactionId)),
    "6304",
  ].join("");

  return `${payload}${crc16(payload)}`;
}
