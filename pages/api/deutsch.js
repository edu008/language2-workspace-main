import {
    getDeutsch,
    createDeutsch,
    updateDeutsch
  } from '../../prisma/deutsch'
  
  export default async function handle(req, res) {
    try {
      switch (req.method) {
        case 'GET': {
          const deutsch = await getDeutsch()
          return res.json(deutsch)
        }
        case 'POST': {
          const { Article, Artikel, Definition, Prefix, Root, Structure, Transl_F, TypeOfWord, Word } = req.body
            const de = await createDeutsch(Article, Artikel, Definition, Prefix, Root, Structure, Transl_F, TypeOfWord, Word)
            return res.json(de)
        }
      
      case 'PUT': {
        const { Id,Article, Artikel, Definition, Prefix, Root, Structure, Transl_F, TypeOfWord, Word } = req.body
          const de = await updateDeutsch(Id, Article, Artikel, Definition, Prefix, Root, Structure, Transl_F, TypeOfWord, Word)
          return res.json(de)
      }
        default:
          break
      }
    } catch (error) {
      return res.status(500).json({ ...error, message: error.message })
    }
  }
