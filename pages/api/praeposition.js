import {
    getPraeposition,
    createPraeposition
  } from '../../prisma/praeposition'
  
  export default async function handle(req, res) {
    try {
      switch (req.method) {
        case 'GET': {
          const praeposition = await getPraeposition()
          return res.json(praeposition)
        }
        case 'POST': {
          const { satz, loesung, quelle } = req.body
            const p = await createPraeposition(satz, loesung, quelle)
            return res.json(p)
        }
        default:
          break
      }
    } catch (error) {
      return res.status(500).json({ ...error, message: error.message })
    }
  }