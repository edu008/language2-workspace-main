import prisma from './prisma';

// CREATE
export const createSprichwort = async (Wort, Sprichwort, Erklaerung, Beispiel, Quelle, Datum) => {
    const sw = await prisma.sprichworts.create({
        data: {
            Wort: Wort,
            Sprichwort: Sprichwort,
            Erklaerung: Erklaerung,
            Beispiel: Beispiel,
            Quelle: Quelle,
            Datum: Datum ? new Date(Datum) : new Date()
        }
    });
    return sw;
};

// UPDATE
export const updateSprichwort = async (id, Wort, Sprichwort, Erklaerung, Beispiel, Quelle, Datum) => {
    try {
        if (!id || !Sprichwort || typeof Sprichwort !== 'string') {
            throw new Error('Invalid input: ID und Sprichwort sind erforderlich');
        }
        const sw = await prisma.sprichworts.update({
            where: { id: id },
            data: {
                Wort: Wort,
                Sprichwort: Sprichwort,
                Erklaerung: Erklaerung,
                Beispiel: Beispiel,
                Quelle: Quelle,
                Datum: Datum ? new Date(Datum) : new Date()
            }
        });
        return sw;
    } catch (error) {
        console.error('Error updating Sprichwort:', error);
        throw error;
    }
};

// READ
export const getSprichwort = async () => {
    const sprichwort = await prisma.sprichworts.findMany();
    return sprichwort;
};
