import {
  getPraeposition,
  createPraeposition,
  updatePraeposition
} from '../../prisma/praeposition';

export default async function handle(req, res) {
  try {
      switch (req.method) {
          case 'GET': {
              const praeposition = await getPraeposition();
              return res.json(praeposition);
          }
          case 'POST': {
              const { Satz, Loesung, quelle, Datum } = req.body; // Anpassung an 'quelle'
              if (!Satz || !Loesung || !quelle) {
                  return res.status(400).json({ error: 'Satz, Loesung und quelle sind erforderlich' });
              }
              const p = await createPraeposition(Satz, Loesung, quelle, Datum);
              return res.json(p);
          }
          case 'PUT': {
              const { id, Satz, Loesung, quelle, Datum } = req.body; // Anpassung an 'quelle'
              if (!id) {
                  return res.status(400).json({ error: 'ID ist erforderlich' });
              }
              const updatedPraeposition = await updatePraeposition(id, Satz, Loesung, quelle, Datum);
              return res.json(updatedPraeposition);
          }
          default:
              return res.status(405).json({ error: 'Method Not Allowed' });
      }
  } catch (error) {
      console.error('❌ Fehler in /api/praeposition:', error);
      return res.status(500).json({ error: 'Interner Serverfehler: ' + error.message });
  }
}