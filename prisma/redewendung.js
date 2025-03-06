import prisma from './prisma';

// CREATE
export const createRedewendung = async (Wort, Redewendung, Erklaerung, Beispiel, Quelle, Datum) => {
    const sw = await prisma.redewendungs.create({
        data: {
            Wort: Wort,
            Redewendung: Redewendung,
            Erklaerung: Erklaerung,
            Beispiel: Beispiel,
            Quelle: Quelle,
            Datum: Datum ? new Date(Datum) : new Date()
        }
    });
    return sw;
};

// UPDATE
export const updateRedewendung = async (id, Wort, Redewendung, Erklaerung, Beispiel, Quelle, Datum) => {
    try {
        if (!id || !Redewendung || typeof Redewendung !== 'string') {
            throw new Error('Invalid input: ID und Redewendung sind erforderlich');
        }
        const sw = await prisma.redewendungs.update({
            where: { id: id },
            data: {
                Wort: Wort,
                Redewendung: Redewendung,
                Erklaerung: Erklaerung,
                Beispiel: Beispiel,
                Quelle: Quelle,
                Datum: Datum ? new Date(Datum) : new Date()
            }
        });
        return sw;
    } catch (error) {
        console.error('Error updating Redewendung:', error);
        throw error;
    }
};

// READ
export const getRedewendung = async () => {
    const redewendung = await prisma.redewendungs.findMany();
    return redewendung;
};
