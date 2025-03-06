import { getDeutsch, createDeutsch, updateDeutsch, getDeutschCount } from "../../prisma/deutsch";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const deutschData = await getDeutsch();
      return res.status(200).json(deutschData);
    }

    if (req.method === "POST") {
      const { Article, Artikel, Definition, Prefix, Root, Structure, Transl_F, TypeOfWord, Word } = req.body;
      const newWord = await createDeutsch(Article, Artikel, Definition, Prefix, Root, Structure, Transl_F, TypeOfWord, Word);
      return res.status(201).json(newWord);
    }

    if (req.method === "PUT") {
      const { id, Article, Artikel, Definition, Prefix, Root, Structure, Transl_F, TypeOfWord, Word } = req.body;
      const updatedWord = await updateDeutsch(id, Article, Artikel, Definition, Prefix, Root, Structure, Transl_F, TypeOfWord, Word);
      return res.status(200).json(updatedWord);
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("❌ Fehler in /api/deutsch:", error);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
}
