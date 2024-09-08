import {
    getDeutschCount
  } from '../../prisma/deutsch'
  
  export default async function handle(req, res) {
    try {
      switch (req.method) {
        case 'GET': {
          const deutsch = await getDeutschCount()
          return res.json(deutsch)
        }
        default:
          break
      }
    } catch (error) {
      return res.status(500).json({ ...error, message: error.message })
    }
  }