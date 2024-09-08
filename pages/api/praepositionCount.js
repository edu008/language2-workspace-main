import {
  getPraepositionCount
} from '../../prisma/praeposition'

export default async function handle(req, res) {
  try {
    switch (req.method) {
      case 'GET': {
        const praeposition = await getPraepositionCount()
        return res.json(praeposition)
      }
      default:
        break
    }
  } catch (error) {
    return res.status(500).json({ ...error, message: error.message })
  }
}