import prisma from './prisma'

// CREATE
export const createPraeposition = async (satz, loesung, quelle) => {
  const p = await prisma.praepositions.create({
    data: {
      Satz: satz, Loesung: loesung, quelle: quelle, Datum: new Date()
    }
  })
  return p
}

// READ
export const getPraeposition = async () => {
  const praeposition = await prisma.praepositions.findMany()
  return praeposition
}

export const getPraepositionCount = async () => {
  const count = await prisma.praepositions.count()
  return count
}