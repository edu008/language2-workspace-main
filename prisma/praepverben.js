import prisma from './prisma';

// CREATE
export const createPraepverben = async (Satz, Verb, Erklaerung, Beispiele, Loesung, quelle, Datum) => {
    const sw = await prisma.praepverbens.create({
        data: {
            Satz: Satz,
            Verb: Verb,
            Erklaerung: Erklaerung,
            Beispiele: Beispiele,
            Loesung: Loesung,
            quelle: quelle,
            Datum: Datum ? new Date(Datum) : new Date()
        }
    });
    return sw;
};

// UPDATE
export const updatePraepverben = async (id, Satz, Verb, Erklaerung, Beispiele, Loesung, quelle, Datum) => {
    try {
        if (!id || !Satz || typeof Satz !== 'string') {
            throw new Error('Invalid input: ID und Satz sind erforderlich');
        }
        const sw = await prisma.praepverbens.update({
            where: { id: id },
            data: {
                Satz: Satz,
                Verb: Verb,
                Erklaerung: Erklaerung,
                Beispiele: Beispiele,
                Loesung: Loesung,
                quelle: quelle,
                Datum: Datum ? new Date(Datum) : new Date()
            }
        });
        return sw;
    } catch (error) {
        console.error('Error updating Praepverben:', error);
        throw error;
    }
};

// READ
export const getPraepverben = async () => {
    const praepverben = await prisma.praepverbens.findMany();
    return praepverben;
};
