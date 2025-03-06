import {
  getSprichwort,
  createSprichwort,
  updateSprichwort
} from '../../prisma/sprichwort';

export default async function handle(req, res) {
  try {
      switch (req.method) {
          case 'GET': {
              const sprichwort = await getSprichwort();
              return res.json(sprichwort);
          }
          case 'POST': {
              const { Wort, Sprichwort, Erklaerung, Beispiel, Quelle, Datum } = req.body;
              if (!Wort || !Sprichwort || !Erklaerung || !Beispiel || !Quelle) {
                  return res.status(400).json({ error: 'Wort, Sprichwort, Erklärung, Beispiel und Quelle sind erforderlich' });
              }
              const sw = await createSprichwort(Wort, Sprichwort, Erklaerung, Beispiel, Quelle, Datum);
              return res.json(sw);
          }
          case 'PUT': {
              const { id, Wort, Sprichwort, Erklaerung, Beispiel, Quelle, Datum } = req.body;
              if (!id) {
                  return res.status(400).json({ error: 'ID ist erforderlich' });
              }
              const updatedSprichwort = await updateSprichwort(id, Wort, Sprichwort, Erklaerung, Beispiel, Quelle, Datum);
              return res.json(updatedSprichwort);
          }
          default:
              return res.status(405).json({ error: 'Method Not Allowed' });
      }
  } catch (error) {
      console.error('❌ Fehler in /api/sprichwort:', error);
      return res.status(500).json({ error: 'Interner Serverfehler: ' + error.message });
  }
}