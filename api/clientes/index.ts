import type { Request, Response } from "express";
import { createCliente, listClientes } from "../../lib/firestore";

export default async function handler(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  try {
    if (req.method === "GET") {
      return res.status(200).json(await listClientes());
    }
    if (req.method === "POST") {
      const created = await createCliente(req.body || {});
      return res.status(201).json(created);
    }
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Método não permitido." });
  } catch (error: any) {
    console.error("Erro em /api/clientes:", error);
    return res.status(500).json({ error: error?.message || "Erro ao acessar o Firestore." });
  }
}
