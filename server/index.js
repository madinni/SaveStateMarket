import "dotenv/config";
import { createApp } from "./app.js";
import { migrate } from "./migrate.js";

const PORT = Number(process.env.PORT || 3001);

await migrate();

createApp().listen(PORT, (error) => {
  // No Express 5 o erro de listen (ex.: porta ocupada) chega neste callback.
  if (error) {
    console.error(`Não foi possível subir a API na porta ${PORT}:`, error.message);
    process.exit(1);
  }
  console.log(`API SaveState Market em http://localhost:${PORT}`);
});
