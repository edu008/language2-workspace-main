import {
  getSprichwortCount
} from '../../prisma/sprichwort'

export default async function handle(req, res) {
  try {
    switch (req.method) {
      case 'GET': {
        const sprichwort = await getSprichwortCount()
        return res.json(sprichwort)
      }
      default:
        break
    }
  } catch (error) {
    return res.status(500).json({ ...error, message: error.message })
  }
}