import prisma from "./prisma";

// READ
export const getStanding = async (user, exercise) => {
  try {
    if (!user || !exercise) {
      throw new Error("User und Exercise sind erforderlich");
    }
    const standingExists = await prisma.standing.findFirst({
      where: {
        user,
        exercise,
      },
    });
    console.log(
      "Get Standing for user:",
      user,
      "exercise:",
      exercise,
      "kategorie:",
      standingExists?.kategorie || "deutsch"
    );
    return standingExists;
  } catch (error) {
    console.error("Fehler beim Abrufen des Standing-Eintrags:", error);
    throw error;
  }
};

export const getStandingAll = async (user) => {
  try {
    if (!user) {
      throw new Error("User ist erforderlich");
    }
    const standing = await prisma.standing.findMany({
      where: {
        user,
      },
    });
    console.log("Get All Standings for user:", user, "Standings:", standing);
    return standing;
  } catch (error) {
    console.error("Fehler beim Abrufen aller Standings:", error);
    throw error;
  }
};

export const getStandingSums = async (user, kategorie) => {
  try {
    if (!user) {
      throw new Error("User ist erforderlich");
    }
    const finalKategorie = kategorie || "deutsch";
    const summary = await prisma.standing.findMany({
      where: {
        user,
        kategorie: finalKategorie,
      },
    });
    return {
      summary, // Nur summary zurückgeben
    };
  } catch (error) {
    console.error("Fehler beim Abrufen der Standing-Summen:", error);
    throw error;
  }
};

// CREATE
export const createStandingOK = async (user, exercise, correct, attempts, kategorie = "deutsch", duration = 0) => {
  try {
    if (!user || !exercise) {
      throw new Error("User und Exercise sind erforderlich");
    }
    const validatedCorrect = correct ?? 1; // Standardwert für den ersten OK-Klick ist 1
    if (!Number.isInteger(validatedCorrect) || validatedCorrect < 0 || validatedCorrect > 2) {
      console.error("Ungültiger Wert für correct in createStandingOK:", validatedCorrect);
      throw new Error("Ungültiger Wert für correct: Muss eine ganze Zahl zwischen 0 und 2 sein.");
    }

    const existingStanding = await prisma.standing.findFirst({
      where: {
        user,
        exercise,
      },
    });
    if (existingStanding) {
      console.warn("Standing existiert bereits, aktualisiere es stattdessen:", existingStanding);
      return await updateStandingOK(existingStanding.id, validatedCorrect, attempts ?? 1, kategorie, duration);
    }

    const standing = await prisma.standing.create({
      data: {
        user,
        exercise,
        kategorie,
        correct: validatedCorrect,
        attempts: attempts ?? 1,
        duration: duration, // Neue Spalte
      },
    });
    console.log("Created Standing OK with correct:", validatedCorrect, "kategorie:", kategorie, "duration:", duration);
    return standing;
  } catch (error) {
    console.error("Fehler beim Erstellen eines OK-Standings:", error);
    throw error;
  }
};

export const createStandingNOK = async (user, exercise, correct, attempts, kategorie = "deutsch", duration = 0) => {
  try {
    if (!user || !exercise) {
      throw new Error("User und Exercise sind erforderlich");
    }
    const validatedCorrect = correct ?? 0; // Standardwert für NOK ist 0
    if (!Number.isInteger(validatedCorrect) || validatedCorrect < 0 || validatedCorrect > 2) {
      console.error("Ungültiger Wert für correct in createStandingNOK:", validatedCorrect);
      throw new Error("Ungültiger Wert für correct: Muss eine ganze Zahl zwischen 0 und 2 sein.");
    }

    const existingStanding = await prisma.standing.findFirst({
      where: {
        user,
        exercise,
      },
    });
    if (existingStanding) {
      console.warn("Standing existiert bereits, aktualisiere es stattdessen:", existingStanding);
      return await updateStandingNOK(existingStanding.id, validatedCorrect, attempts ?? 1, kategorie, duration);
    }

    const standing = await prisma.standing.create({
      data: {
        user,
        exercise,
        kategorie,
        correct: validatedCorrect,
        attempts: attempts ?? 1,
        duration: duration, // Neue Spalte
      },
    });
    console.log("Created Standing NOK with correct:", validatedCorrect, "kategorie:", kategorie, "duration:", duration);
    return standing;
  } catch (error) {
    console.error("Fehler beim Erstellen eines NOK-Standings:", error);
    throw error;
  }
};

// UPDATE
export const updateStandingOK = async (standingId, correct, attempts, kategorie = "deutsch", duration = 0) => {
  try {
    if (!standingId) {
      throw new Error("StandingId ist erforderlich");
    }
    const existingStanding = await prisma.standing.findUnique({
      where: { id: standingId },
    });
    if (!existingStanding) {
      throw new Error("Standing-Eintrag nicht gefunden.");
    }

    let validatedCorrect = correct ?? (existingStanding.correct + 1);
    if (validatedCorrect > 2) validatedCorrect = 2; // Begrenze auf 2 (gelernt)
    if (!Number.isInteger(validatedCorrect) || validatedCorrect < 0 || validatedCorrect > 2) {
      console.error("Ungültiger Wert für correct in updateStandingOK:", validatedCorrect);
      throw new Error("Ungültiger Wert für correct: Muss eine ganze Zahl zwischen 0 und 2 sein.");
    }

    const standing = await prisma.standing.update({
      where: {
        id: standingId,
      },
      data: {
        correct: validatedCorrect,
        attempts: attempts ?? (existingStanding.attempts + 1),
        kategorie: kategorie,
        duration: duration || existingStanding.duration || 0, // Aktualisiere oder behalte bestehenden Wert
      },
    });
    console.log("Updated Standing OK with correct:", validatedCorrect, "kategorie:", kategorie, "duration:", duration);
    return standing;
  } catch (error) {
    console.error("Fehler beim Aktualisieren eines OK-Standings:", error);
    throw error;
  }
};

export const updateStandingNOK = async (standingId, correct, attempts, kategorie = "deutsch", duration = 0) => {
  try {
    if (!standingId) {
      throw new Error("StandingId ist erforderlich");
    }
    const validatedCorrect = correct ?? 0; // Standardwert für NOK ist 0
    if (!Number.isInteger(validatedCorrect) || validatedCorrect < 0 || validatedCorrect > 2) {
      console.error("Ungültiger Wert für correct in updateStandingNOK:", validatedCorrect);
      throw new Error("Ungültiger Wert für correct: Muss eine ganze Zahl zwischen 0 und 2 sein.");
    }

    const existingStanding = await prisma.standing.findUnique({
      where: { id: standingId },
    });
    if (!existingStanding) {
      throw new Error("Standing-Eintrag nicht gefunden.");
    }

    const standing = await prisma.standing.update({
      where: {
        id: standingId,
      },
      data: {
        correct: validatedCorrect,
        attempts: attempts ?? (existingStanding.attempts + 1),
        kategorie: kategorie,
        duration: duration || existingStanding.duration || 0, // Aktualisiere oder behalte bestehenden Wert
      },
    });
    console.log("Updated Standing NOK with correct:", validatedCorrect, "kategorie:", kategorie, "duration:", duration);
    return standing;
  } catch (error) {
    console.error("Fehler beim Aktualisieren eines NOK-Standings:", error);
    throw error;
  }
};

// DELETE
export const deleteStandings = async (user, kategorie) => {
  try {
    if (!user) {
      throw new Error("User ist erforderlich");
    }
    const finalKategorie = kategorie || "deutsch";
    const standing = await prisma.standing.deleteMany({
      where: {
        user,
        kategorie: finalKategorie,
      },
    });
    console.log(`Alle Standing-Einträge für Benutzer ${user} und Kategorie ${finalKategorie} gelöscht.`);
    return standing;
  } catch (error) {
    console.error("Fehler beim Löschen der Standings:", error);
    throw error;
  }
};