import express from "express";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "dft-backend" });
});

app.listen(port, () => {
  console.log(`DFT backend listening on http://127.0.0.1:${port}`);
});
