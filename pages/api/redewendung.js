import {
  getRedewendung,
  createRedewendung
} from '../../prisma/redewendung'

export default async function handle(req, res) {
  try {
    switch (req.method) {
      case 'GET': {
        const redewendung = await getRedewendung()
        return res.json(redewendung)
      }
      case 'POST': {
        const { wort, redewendung, erklärung, beispiel, quelle } = req.body
          const sw = await createRedewendung(wort, redewendung, erklärung, beispiel, quelle)
          return res.json(sw)
      }
      default:
        break
    }
  } catch (error) {
    return res.status(500).json({ ...error, message: error.message })
  }
}