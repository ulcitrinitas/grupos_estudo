import express from "express";
import { mostrarAlunoGrupoGrafo, testaConn } from "./neo4jQueries.js";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 8000;

app.get("/", (_req, res) => {
  res.json({
    Hello: "World",
    Foo: "Bar"
  });
});

app.get("/participantes", async (_req, res) => {
  try {
    const dbAuth = await testaConn();
    const registros = await mostrarAlunoGrupoGrafo(dbAuth);
    res.json(registros);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.listen(port, () => {
  process.stdout.write(`Server running on port ${port}\n`);
});
