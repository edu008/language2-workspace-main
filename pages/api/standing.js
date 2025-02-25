// File: pages/api/standing.js

import {
  createStandingOK,
  createStandingNOK,
  getStanding,
  updateStandingOK,
  updateStandingNOK,
  updateStandingTrained,
  deleteStandings,
  getStandingAll,
  getStandingSums
} from '../../prisma/standing';

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET': {
        if (req.query.kategorie) {
          const standingSums = await getStandingSums(req.query.user, req.query.kategorie);
          return res.json({
            trainedSum: standingSums.trainedSum,
            alltimeSum: standingSums.alltimeSum,
            finished: standingSums.finished,
            summary: standingSums.summary
          });
        } else if (req.query.exercise) {
          const standing = await getStanding(req.query.user, req.query.exercise);
          return res.json(standing);
        } else {
          const standing = await getStandingAll(req.query.user);
          return res.json(standing);
        }
      }
      case 'POST': {
        const { user, exercise, button, kategorie, upsert } = req.body;
        if (!user || !exercise || !button) {
          return res.status(400).json({ error: 'Missing required fields.' });
        }
        if (upsert) {
          const existing = await getStanding(user, exercise);
          if (existing) {
            if (button === 'OK') {
              const updated = await updateStandingOK(existing.id, button);
              return res.status(200).json(updated);
            } else if (button === 'NOK') {
              const updated = await updateStandingNOK(existing.id, button);
              return res.status(200).json(updated);
            } else if (button === 'trained') {
              const updated = await updateStandingTrained(existing.id, button);
              return res.status(200).json(updated);
            } else {
              return res.status(400).json({ error: 'Unbekannter Button-Wert.' });
            }
          } else {
            if (button === 'OK') {
              const created = await createStandingOK(user, exercise, button, kategorie);
              return res.status(201).json(created);
            } else if (button === 'NOK') {
              const created = await createStandingNOK(user, exercise, button, kategorie);
              return res.status(201).json(created);
            } else {
              return res.status(400).json({ error: 'Unbekannter Button-Wert.' });
            }
          }
        } else {
          if (button === 'OK') {
            const standing = await createStandingOK(user, exercise, button, kategorie);
            return res.json(standing);
          }
          if (button === 'NOK') {
            const standing = await createStandingNOK(user, exercise, button, kategorie);
            return res.json(standing);
          }
          return res.status(400).json({ error: 'Unbekannter Button-Wert.' });
        }
      }
      case 'PUT': {
        const { standingIN, button } = req.body;
        if (button === "OK") {
          const standing = await updateStandingOK(standingIN, button);
          return res.json(standing);
        } else if (button === "NOK") {
          const standing = await updateStandingNOK(standingIN, button);
          return res.json(standing);
        } else if (button === "trained") {
          const standing = await updateStandingTrained(standingIN, button);
          return res.json(standing);
        }
        return res.status(400).json({ error: 'Unbekannter Button-Wert.' });
      }
      case 'DELETE': {
        const { user, kategorie } = req.body;
        const standing = await deleteStandings(user, kategorie);
        return res.json(standing);
      }
      default: {
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    }
  } catch (error) {
    console.error("Standing API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
