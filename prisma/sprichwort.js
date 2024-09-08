import prisma from './prisma'

// CREATE
export const createSprichwort = async (wort, sprichwort, erklärung, beispiel, quelle) => {
  const sw = await prisma.sprichworts.create({
    data: {
      Wort: wort, Sprichwort: sprichwort, Erklaerung: erklärung, Beispiel: beispiel, Quelle: quelle, Datum: new Date()
    }
  })
  return sw
}

// READ
export const getSprichwort = async () => {
  const sprichwort = await prisma.sprichworts.findMany()
  return sprichwort
}

export const getSprichwortCount = async () => {
  const count = await prisma.sprichworts.count()
  return count
}