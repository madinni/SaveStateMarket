import "dotenv/config";
import { createApp } from "./app.js";
import { migrate } from "./migrate.js";
import { problemaDoSegredo } from "./auth.js";

const PORT = Number(process.env.PORT || 3001);

// Não sobe com SEGREDO ausente, de exemplo ou fraco (tokens JWT seriam forjáveis).
const problema = problemaDoSegredo();
if (problema) {
  console.error(`Não foi possível subir a API: ${problema}`);
  process.exit(1);
}

try {
  await migrate();
} catch (error) {
  // Qualquer falha na migração do db.json impede a API de subir, com mensagem clara.
  console.error(`Não foi possível subir a API: ${error.message}`);
  process.exit(1);
}

createApp().listen(PORT, (error) => {
  // No Express 5 o erro de listen (ex.: porta ocupada) chega neste callback.
  if (error) {
    console.error(`Não foi possível subir a API na porta ${PORT}:`, error.message);
    process.exit(1);
  }
  console.log(`API SaveState Market em http://localhost:${PORT}`);
});
