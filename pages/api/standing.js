import {
  createStandingOK,
  createStandingNOK,
  updateStandingOK,
  updateStandingNOK,
  getStanding,
  getStandingAll,
  getStandingSums,
  deleteStandings,
} from "../../prisma/standing";

export default async function handler(req, res) {
  const { method, query, body } = req;

  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  try {
    switch (method) {
      case "GET":
        if (query.exercise && query.kategorie) {
          const standing = await getStanding(query.user, query.exercise, query.kategorie);
          res.status(200).json(standing || {});
        } else if (query.kategorie) {
          const sums = await getStandingSums(query.user, query.kategorie);
          res.status(200).json(sums || { summary: [] });
        } else {
          res.status(400).json({ error: "Kategorie ist erforderlich" });
        }
        break;
      case "POST":
        if (!body.kategorie) {
          return res.status(400).json({ error: "Kategorie ist erforderlich" });
        }
        if (body.button === "OK") {
          const standing = await getStanding(body.user, body.exercise, body.kategorie);
          if (standing) {
            await updateStandingOK(standing.id, body.correct, body.attempts);
          } else {
            await createStandingOK(body.user, body.exercise, body.correct ?? 1, body.attempts ?? 1, body.kategorie);
          }
          res.status(200).json({ message: "OK Standing updated/created" });
        } else if (body.button === "NOK") {
          const standing = await getStanding(body.user, body.exercise, body.kategorie);
          if (standing) {
            await updateStandingNOK(standing.id, body.correct ?? 0, body.attempts);
          } else {
            await createStandingNOK(body.user, body.exercise, body.correct ?? 0, body.attempts ?? 1, body.kategorie);
          }
          res.status(200).json({ message: "NOK Standing updated/created" });
        }
        break;
      case "PUT":
        if (body.button === "OK") {
          await updateStandingOK(body.standingIN, body.correct, body.attempts);
          res.status(200).json({ message: "OK Standing updated" });
        } else if (body.button === "NOK") {
          await updateStandingNOK(body.standingIN, body.correct ?? 0, body.attempts);
          res.status(200).json({ message: "NOK Standing updated" });
        }
        break;
      case "DELETE":
        if (!body.kategorie) {
          return res.status(400).json({ error: "Kategorie ist erforderlich" });
        }
        await deleteStandings(body.user, body.kategorie);
        res.status(200).json({ message: "Standings deleted" });
        break;
      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: error.message });
  }
}