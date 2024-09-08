import {
  getSprichwort,
  createSprichwort
} from '../../prisma/sprichwort'

export default async function handle(req, res) {
  try {
    switch (req.method) {
      case 'GET': {
        const sprichwort = await getSprichwort()
        return res.json(sprichwort)
      }
      case 'POST': {
        const { wort, sprichwort, erklärung, beispiel, quelle } = req.body
          const sw = await createSprichwort(wort, sprichwort, erklärung, beispiel, quelle)
          return res.json(sw)
      }
      default:
        break
    }
  } catch (error) {
    return res.status(500).json({ ...error, message: error.message })
  }
}