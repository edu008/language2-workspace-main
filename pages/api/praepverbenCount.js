import {
    getPraepverbenCount
  } from '../../prisma/praepverben'
  
  export default async function handle(req, res) {
    try {
      switch (req.method) {
        case 'GET': {
          const praepverben = await getPraepverbenCount()
          return res.json(praepverben)
        }
        default:
          break
      }
    } catch (error) {
      return res.status(500).json({ ...error, message: error.message })
    }
  }