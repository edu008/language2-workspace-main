import {
    getPraepverben,
    createPraepverben
  } from '../../prisma/praepverben'
  
  export default async function handle(req, res) {
    try {
      switch (req.method) {
        case 'GET': {
          const praepverben = await getPraepverben()
          return res.json(praepverben)
        }
        case 'POST': {
          const { satz, verb, erklaerung, beispiel, loesung, quelle } = req.body
            const sw = await createPraepverben(satz, verb, erklaerung, beispiel, loesung, quelle )
            return res.json(sw)
        }
        default:
          break
      }
    } catch (error) {
      return res.status(500).json({ ...error, message: error.message })
    }
  }