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

  // Setze Cache-Header, um Caching zu verhindern
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  try {
    switch (method) {
      case "GET":
        if (query.exercise) {
          console.log("GET Standing for user:", query.user, "exercise:", query.exercise, "kategorie:", query.kategorie);
          const standing = await getStanding(query.user, query.exercise);
          res.status(200).json(standing || {});
        } else {
          console.log("GET StandingSums for user:", query.user, "kategorie:", query.kategorie);
          const sums = await getStandingSums(query.user, query.kategorie);
          res.status(200).json(sums || { summary: [] });
        }
        break;
      case "POST":
        console.log("POST Standing for user:", body.user, "exercise:", body.exercise, "kategorie:", body.kategorie, "button:", body.button);
        if (body.button === "OK") {
          const standing = await getStanding(body.user, body.exercise);
          if (standing) {
            await updateStandingOK(standing.id, body.correct, body.attempts, body.kategorie);
          } else {
            await createStandingOK(body.user, body.exercise, body.correct ?? 1, body.attempts ?? 1, body.kategorie);
          }
          res.status(200).json({ message: "OK Standing updated/created", kategorie: body.kategorie });
        } else if (body.button === "NOK") {
          const standing = await getStanding(body.user, body.exercise);
          if (standing) {
            await updateStandingNOK(standing.id, body.correct ?? 0, body.attempts, body.kategorie);
          } else {
            await createStandingNOK(body.user, body.exercise, body.correct ?? 0, body.attempts ?? 1, body.kategorie);
          }
          res.status(200).json({ message: "NOK Standing updated/created", kategorie: body.kategorie });
        }
        break;
      case "PUT":
        console.log("PUT Standing for standingId:", body.standingIN, "kategorie:", body.kategorie, "button:", body.button);
        if (body.button === "OK") {
          await updateStandingOK(body.standingIN, body.correct, body.attempts, body.kategorie);
          res.status(200).json({ message: "OK Standing updated", kategorie: body.kategorie });
        } else if (body.button === "NOK") {
          await updateStandingNOK(body.standingIN, body.correct ?? 0, body.attempts, body.kategorie);
          res.status(200).json({ message: "NOK Standing updated", kategorie: body.kategorie });
        }
        break;
      case "DELETE":
        console.log("DELETE Standings for user:", body.user, "kategorie:", body.kategorie);
        await deleteStandings(body.user, body.kategorie);
        res.status(200).json({ message: "Standings deleted", kategorie: body.kategorie });
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