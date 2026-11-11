import "dotenv/config";
import { createApp } from "./app.js";
import { migrate } from "./migrate.js";
import { problemaDoSegredo } from "./auth.js";
import { initialize } from "./store.js";

const PORT = Number(process.env.PORT || 3001);

// Não sobe com SEGREDO ausente, de exemplo ou fraco (tokens JWT seriam forjáveis).
const problema = problemaDoSegredo();
if (problema) {
  console.error(`Não foi possível subir a API: ${problema}`);
  process.exit(1);
}

try {
  await initialize();
  await migrate();
} catch (error) {
  console.error(`Não foi possível conectar ou preparar o PostgreSQL: ${error.message}`);
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
