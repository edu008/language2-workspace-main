import {
  getRedewendung,
  createRedewendung,
  updateRedewendung
} from '../../prisma/redewendung';

export default async function handle(req, res) {
  try {
      switch (req.method) {
          case 'GET': {
              const redewendung = await getRedewendung();
              return res.json(redewendung);
          }
          case 'POST': {
              const { Wort, Redewendung, Erklaerung, Beispiel, Quelle, Datum } = req.body;
              if (!Wort || !Redewendung || !Erklaerung || !Beispiel || !Quelle) {
                  return res.status(400).json({ error: 'Wort, Redewendung, Erklärung, Beispiel und Quelle sind erforderlich' });
              }
              const sw = await createRedewendung(Wort, Redewendung, Erklaerung, Beispiel, Quelle, Datum);
              return res.json(sw);
          }
          case 'PUT': {
              const { id, Wort, Redewendung, Erklaerung, Beispiel, Quelle, Datum } = req.body;
              if (!id) {
                  return res.status(400).json({ error: 'ID ist erforderlich' });
              }
              const updatedRedewendung = await updateRedewendung(id, Wort, Redewendung, Erklaerung, Beispiel, Quelle, Datum);
              return res.json(updatedRedewendung);
          }
          default:
              return res.status(405).json({ error: 'Method Not Allowed' });
      }
  } catch (error) {
      console.error('❌ Fehler in /api/redewendung:', error);
      return res.status(500).json({ error: 'Interner Serverfehler: ' + error.message });
  }
}