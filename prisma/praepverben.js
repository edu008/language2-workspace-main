import prisma from './prisma'

// CREATE
export const createPraepverben = async (satz, verb, erklaerung, beispiel, loesung, quelle) => {
  const sw = await prisma.praepverbens.create({
    data: {
      Satz: satz, Verb: verb, Erklaerung: erklaerung, Beispiele: beispiel, Loesung: loesung, Datum: new Date(), quelle: quelle
    }
  })
  return sw
}

// READ
export const getPraepverben = async () => {
  const praepverben = await prisma.praepverbens.findMany()
  return praepverben
}

export const getPraepverbenCount = async () => {
  const count = await prisma.praepverbens.count()
  return count
}