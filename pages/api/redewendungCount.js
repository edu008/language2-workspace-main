import {
  getRedewendungCount
} from '../../prisma/redewendung'

export default async function handle(req, res) {
  try {
    switch (req.method) {
      case 'GET': {
        const redewendung = await getRedewendungCount()
        return res.json(redewendung)
      }
      default:
        break
    }
  } catch (error) {
    return res.status(500).json({ ...error, message: error.message })
  }
}