import prisma from './prisma'


// CREATE
export const createDeutsch = async (Article, Artikel, Definition, Prefix, Root, Structure, Transl_F, TypeOfWord, Word) => {
  const de = await prisma.deutschs.create({
    data: {
        Article, Artikel, Definition, Prefix, Root, Structure, Transl_F, TypeOfWord, Word, DateEntryWord: new Date()
    }
  })
  return de
}
export const updateDeutsch = async (Id, Article, Artikel, Definition, Prefix, Root, Structure, Transl_F, TypeOfWord, Word) => {
  const de = await prisma.deutschs.update({where: { id: Id },
    data: {
        Article, Artikel, Definition, Prefix, Root, Structure, Transl_F, TypeOfWord, Word, DateEntryWord: new Date()
    }
  })
  return de
}

// READ
export const getDeutsch = async () => {
  const deutsch = await prisma.deutschs.findMany()
  return deutsch
}

export const getDeutschCount = async () => {
  const count = await prisma.deutschs.count()
  return count
}