import prisma from './prisma';

// CREATE
export const createPraeposition = async (Satz, Loesung, quelle, Datum) => {
    const p = await prisma.praepositions.create({
        data: {
            Satz: Satz,
            Loesung: Loesung,
            quelle: quelle, // Klein geschrieben
            Datum: Datum ? new Date(Datum) : new Date() // Vom Frontend oder aktuell
        }
    });
    return p;
};

// UPDATE
export const updatePraeposition = async (id, Satz, Loesung, quelle, Datum) => {
    try {
        if (!id || !Satz || typeof Satz !== 'string') {
            throw new Error('Invalid input: ID und Satz sind erforderlich');
        }
        const p = await prisma.praepositions.update({
            where: { id: id },
            data: {
                Satz: Satz,
                Loesung: Loesung,
                quelle: quelle,
                Datum: Datum ? new Date(Datum) : new Date()
            }
        });
        return p;
    } catch (error) {
        console.error('Error updating Praeposition:', error);
        throw error;
    }
};

// READ
export const getPraeposition = async () => {
    const praeposition = await prisma.praepositions.findMany();
    return praeposition;
};