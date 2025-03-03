import prisma from './prisma';

// READ
export const getStanding = async (user, exercise, kategorie) => {
  try {
    const standingExists = await prisma.Standing.findFirst({
      where: {
        user,
        exercise,
        kategorie, // Dynamische Kategorie
      },
    });
    return standingExists;
  } catch (error) {
    console.error("Fehler beim Abrufen des Standing-Eintrags:", error);
    throw error;
  }
};

export const getStandingAll = async (user) => {
  try {
    const standing = await prisma.Standing.findMany({
      where: {
        user,
      },
    });
    return standing;
  } catch (error) {
    console.error("Fehler beim Abrufen aller Standings:", error);
    throw error;
  }
};

export const getStandingSums = async (user, kategorie) => {
  try {
    const summary = await prisma.Standing.findMany({
      where: {
        user,
        kategorie,
      },
    });

    return {
      summary,
    };
  } catch (error) {
    console.error("Fehler beim Abrufen der Standing-Summen:", error);
    throw error;
  }
};

// CREATE
export const createStandingOK = async (user, exercise, correct, attempts, kategorie) => {
  try {
    const validatedCorrect = correct ?? 1;
    if (!Number.isInteger(validatedCorrect) || validatedCorrect < 0 || validatedCorrect > 2) {
      console.error("Ungültiger Wert für correct in createStandingOK:", validatedCorrect);
      throw new Error("Ungültiger Wert für correct: Muss eine ganze Zahl zwischen 0 und 2 sein.");
    }

    const standing = await prisma.Standing.create({
      data: {
        user,
        exercise,
        kategorie, // Dynamische Kategorie
        correct: validatedCorrect,
        attempts: attempts ?? 1,
      },
    });
    console.log("Created Standing OK with correct:", validatedCorrect);
    return standing;
  } catch (error) {
    console.error("Fehler beim Erstellen eines OK-Standings:", error);
    throw error;
  }
};

export const createStandingNOK = async (user, exercise, correct, attempts, kategorie) => {
  try {
    const validatedCorrect = correct ?? 0;
    if (!Number.isInteger(validatedCorrect) || validatedCorrect < 0 || validatedCorrect > 2) {
      console.error("Ungültiger Wert für correct in createStandingNOK:", validatedCorrect);
      throw new Error("Ungültiger Wert für correct: Muss eine ganze Zahl zwischen 0 und 2 sein.");
    }

    const standing = await prisma.Standing.create({
      data: {
        user,
        exercise,
        kategorie, // Dynamische Kategorie
        correct: validatedCorrect,
        attempts: attempts ?? 1,
      },
    });
    console.log("Created Standing NOK with correct:", validatedCorrect);
    return standing;
  } catch (error) {
    console.error("Fehler beim Erstellen eines NOK-Standings:", error);
    throw error;
  }
};

// UPDATE
export const updateStandingOK = async (standingIN, correct, attempts) => {
  try {
    const existingStanding = await prisma.Standing.findUnique({
      where: { id: standingIN },
    });
    if (!existingStanding) {
      throw new Error("Standing-Eintrag nicht gefunden.");
    }

    let validatedCorrect = correct ?? (existingStanding.correct + 1);
    if (validatedCorrect > 2) validatedCorrect = 2;
    if (!Number.isInteger(validatedCorrect) || validatedCorrect < 0 || validatedCorrect > 2) {
      console.error("Ungültiger Wert für correct in updateStandingOK:", validatedCorrect);
      throw new Error("Ungültiger Wert für correct: Muss eine ganze Zahl zwischen 0 und 2 sein.");
    }

    const standing = await prisma.Standing.update({
      where: {
        id: standingIN,
      },
      data: {
        correct: validatedCorrect,
        attempts: attempts ?? (existingStanding.attempts + 1),
      },
    });
    console.log("Updated Standing OK with correct:", validatedCorrect);
    return standing;
  } catch (error) {
    console.error("Fehler beim Aktualisieren eines OK-Standings:", error);
    throw error;
  }
};

export const updateStandingNOK = async (standingIN, correct, attempts) => {
  try {
    const validatedCorrect = correct ?? 0;
    if (!Number.isInteger(validatedCorrect) || validatedCorrect < 0 || validatedCorrect > 2) {
      console.error("Ungültiger Wert für correct in updateStandingNOK:", validatedCorrect);
      throw new Error("Ungültiger Wert für correct: Muss eine ganze Zahl zwischen 0 und 2 sein.");
    }

    const standing = await prisma.Standing.update({
      where: {
        id: standingIN,
      },
      data: {
        correct: validatedCorrect,
        attempts: attempts ?? (await prisma.Standing.findUnique({ where: { id: standingIN } })).attempts + 1,
      },
    });
    console.log("Updated Standing NOK with correct:", validatedCorrect);
    return standing;
  } catch (error) {
    console.error("Fehler beim Aktualisieren eines NOK-Standings:", error);
    throw error;
  }
};

// DELETE
export const deleteStandings = async (user, kategorie) => {
  try {
    const standing = await prisma.Standing.deleteMany({
      where: {
        user,
        kategorie,
      },
    });
    console.log(`Alle Standing-Einträge für Benutzer ${user} und Kategorie ${kategorie} gelöscht.`);
    return standing;
  } catch (error) {
    console.error("Fehler beim Löschen der Standings:", error);
    throw error;
  }
};