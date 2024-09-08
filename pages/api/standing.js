import {
  createStandingOK,
  createStandingNOK,
  getStanding,
  updateStandingOK,
  updateStandingNOK,
  deleteStandings,
  updateStandingTrained,
  getStandingAll,
  getStandingSums
} from '../../prisma/standing'

export default async function handle(req, res) {
  try {
    switch (req.method) {
      case 'GET': {
        if (req.query.kategorie) {
          const standingSums = await getStandingSums(req.query.user, req.query.kategorie)
          return res.json({
            trainedSum: standingSums.trainedSum,
            alltimeSum: standingSums.alltimeSum,
            finished: standingSums.finished,
            summary: standingSums.summary
          })
        }
        else if (req.query.exercise) {
          const standing = await getStanding(req.query.user, req.query.exercise)
          return res.json(standing)
        }
        else {
          const standing = await getStandingAll(req.query.user)
          return res.json(standing)
        }
      }
      case 'POST': {
        const { user, exercise, button, kategorie } = req.body
        if (button == "OK") {
          const standing = await createStandingOK(user, exercise, button, kategorie)
          return res.json(standing)
        }
        if (button == "NOK") {
          const standing = await createStandingNOK(user, exercise, button, kategorie)
          return res.json(standing)
        }
      }
      case 'PUT': {
        const { standingIN, button } = req.body
        if (button == "OK") {
          const standing = await updateStandingOK(standingIN, button)
          return res.json(standing)
        }
        else if (button == "NOK") {
          const standing = await updateStandingNOK(standingIN, button)
          return res.json(standing)
        } else if (button == "trained") {
          const standing = await updateStandingTrained(standingIN, button)
          return res.json(standing)
        }
      }
      case 'DELETE': {
        const { user, kategorie } = req.body
        const standing = await deleteStandings(user, kategorie)
        return res.json(standing)
      }
      default:
        break
    }
  } catch (error) {
    return res.status(500).json({ ...error, message: error.message })
  }
}