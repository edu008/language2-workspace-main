import {
  getStanding,
  getStandingSums,
  createStandingOK,
  createStandingNOK,
  updateStandingOK,
  updateStandingNOK,
  deleteStandings,
} from "../../prisma/standing";

export default async function handler(req, res) {
  const { method, query, body } = req;

  // Setze Cache-Header
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  try {
    // Standardwert für kategorie, falls nicht angegeben
    const kategorie = query.kategorie || body?.kategorie || "deutsch";

    switch (method) {
      case "GET":
        if (query.exercise) {
          // Prüfe, ob user und exercise vorhanden sind
          if (!query.user || !query.exercise) {
            return res.status(400).json({ error: "User und Exercise sind erforderlich" });
          }
          const standing = await getStanding(query.user, query.exercise);
          res.status(200).json(standing || {});
        } else {
          if (!query.user) {
            return res.status(400).json({ error: "User ist erforderlich" });
          }
          const sums = await getStandingSums(query.user, kategorie);
          res.status(200).json(sums || { summary: [] });
        }
        break;

      case "POST":
        // Prüfe, ob benötigte Felder vorhanden sind
        if (!body.user || !body.exercise || !body.button) {
          return res.status(400).json({ error: "User, Exercise und Button sind erforderlich" });
        }

        if (body.button === "OK") {
          const standing = await getStanding(body.user, body.exercise);
          if (standing) {
            await updateStandingOK(standing.id, body.correct, body.attempts, kategorie);
            res.status(200).json({ message: "OK Standing updated", standingId: standing.id });
          } else {
            const newStanding = await createStandingOK(
              body.user,
              body.exercise,
              body.correct ?? 1,
              body.attempts ?? 1,
              kategorie
            );
            res.status(200).json({ message: "OK Standing created", standingId: newStanding.id });
          }
        } else if (body.button === "NOK") {
          const standing = await getStanding(body.user, body.exercise);
          if (standing) {
            await updateStandingNOK(standing.id, body.correct ?? 0, body.attempts, kategorie);
            res.status(200).json({ message: "NOK Standing updated", standingId: standing.id });
          } else {
            const newStanding = await createStandingNOK(
              body.user,
              body.exercise,
              body.correct ?? 0,
              body.attempts ?? 1,
              kategorie
            );
            res.status(200).json({ message: "NOK Standing created", standingId: newStanding.id });
          }
        } else {
          res.status(400).json({ error: "Invalid button value" });
        }
        break;

      case "DELETE":
        if (!query.user) {
          return res.status(400).json({ error: "User ist erforderlich" });
        }
        await deleteStandings(query.user, kategorie);
        res.status(200).json({ message: "Standings deleted", kategorie });
        break;

      default:
        res.setHeader("Allow", ["GET", "POST", "DELETE"]);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}