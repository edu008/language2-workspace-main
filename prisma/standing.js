import prisma from './prisma'

// READ
export const getStanding = async (user, exercise) => {
  const standingExists = await prisma.standings.findFirst({
    where: {
      AND: [{ user }, { exercise }]
    }
  })
  return standingExists
}

export const getStandingAll = async user => {
  const standing = await prisma.standings.findMany({
    where: {
      AND: [{ user }, { correct: { gt: 1 } }]
    }
  })
  return standing
}

export const getStandingSums = async (user, kategorie) => {
  const result = await prisma.standings.aggregate({
    where: {
      AND: [{ user }, { kategorie }]
    },
    _sum: {
      trained: true,
      alltime: true
    }
  })
  const finished = await prisma.standings.count({
    where: {
      AND: [{ user }, { kategorie }, { correct: { gt: 1 } }]
    }
  })
  const summary = await prisma.standings.findMany({
    where: {
      AND: [{ user }, { trained: { gt: 0 } }, { kategorie }]
    }
  })
  return {
    trainedSum: result._sum.trained,
    alltimeSum: result._sum.alltime,
    finished: finished,
    summary: summary
  }
}

// CREATE
export const createStandingOK = async (user, exercise, button, kategorie) => {
  const standing = await prisma.standings.create({
    data: {
      user,
      exercise,
      kategorie,
      trained: 1,
      correct: 1,
      alltime: 1
    }
  })
  return standing
}

export const createStandingNOK = async (user, exercise, button, kategorie) => {
  const standing = await prisma.standings.create({
    data: {
      user,
      exercise,
      kategorie,
      trained: 1,
      correct: 0,
      alltime: 1
    }
  })
  return standing
}

// UPDATE
export const updateStandingOK = async (standingIN, button) => {
  const standing = await prisma.standings.update({
    where: {
      id: standingIN
    },
    data: {
      trained: { increment: 1 },
      correct: { increment: 1 },
      alltime: { increment: 1 }
    }
  })
  return standing
}

export const updateStandingNOK = async (standingIN, button) => {
  const standing = await prisma.standings.update({
    where: {
      id: standingIN
    },
    data: {
      trained: { increment: 1 },
      correct: 0,
      alltime: { increment: 1 }
    }
  })
  return standing
}

export const updateStandingTrained = async (standingIN, button) => {
  const standing = await prisma.standings.updateMany({
    where: {
      user: standingIN
    },
    data: {
      trained: 0,
    }
  })
  return standing
}

// DELETE
export const deleteStandings = async (user, kategorie) => {
  const standing = await prisma.standings.deleteMany({
    where: {
      user,
      kategorie
    }
  })
  return standing
}