import type { Request, Response } from "express";
import { findCliente } from "../../lib/firestore";

export default async function handler(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido nesta rota." });
  }

  try {
    const raw = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    const client = await findCliente(String(raw || ""));
    if (!client) return res.status(404).json({ error: "Paciente não localizado." });
    return res.status(200).json(client);
  } catch (error: any) {
    console.error("Erro ao abrir link público:", error);
    return res.status(500).json({ error: error?.message || "Erro ao consultar o paciente." });
  }
}
