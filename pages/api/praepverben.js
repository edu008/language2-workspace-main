import {
  getPraepverben,
  createPraepverben,
  updatePraepverben
} from '../../prisma/praepverben';

export default async function handle(req, res) {
  try {
      switch (req.method) {
          case 'GET': {
              const praepverben = await getPraepverben();
              return res.json(praepverben);
          }
          case 'POST': {
              const { Satz, Verb, Erklaerung, Beispiele, Loesung, quelle, Datum } = req.body;
              if (!Satz || !Verb || !Erklaerung || !Beispiele || !Loesung || !quelle) {
                  return res.status(400).json({ error: 'Satz, Verb, Erklärung, Beispiele, Lösung und Quelle sind erforderlich' });
              }
              const sw = await createPraepverben(Satz, Verb, Erklaerung, Beispiele, Loesung, quelle, Datum);
              return res.json(sw);
          }
          case 'PUT': {
              const { id, Satz, Verb, Erklaerung, Beispiele, Loesung, quelle, Datum } = req.body;
              if (!id) {
                  return res.status(400).json({ error: 'ID ist erforderlich' });
              }
              const updatedPraepverben = await updatePraepverben(id, Satz, Verb, Erklaerung, Beispiele, Loesung, quelle, Datum);
              return res.json(updatedPraepverben);
          }
          default:
              return res.status(405).json({ error: 'Method Not Allowed' });
      }
  } catch (error) {
      console.error('❌ Fehler in /api/praepverben:', error);
      return res.status(500).json({ error: 'Interner Serverfehler: ' + error.message });
  }
}