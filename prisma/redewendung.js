import prisma from './prisma'

// CREATE
export const createRedewendung = async (wort, redewendung, erklärung, beispiel, quelle) => {
  const sw = await prisma.redewendungs.create({
    data: {
      Wort: wort, Redewendung: redewendung, Erklaerung: erklärung, Beispiel: beispiel, Quelle: quelle, Datum: new Date()
    }
  })
  return sw
}

// READ
export const getRedewendung = async () => {
  const redewendung = await prisma.redewendungs.findMany()
  return redewendung
}

export const getRedewendungCount = async () => {
  const count = await prisma.redewendungs.count()
  return count
}