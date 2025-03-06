import prisma from './prisma';

// CREATE
export const createDeutsch = async (Article, Artikel, Definition, Prefix, Root, Structure, Transl_F, TypeOfWord, Word) => {
  try {
    if (!Word || typeof Word !== 'string') {
      throw new Error('Invalid Word');
    }
    const de = await prisma.deutschs.create({
      data: {
        Article, Artikel, Definition, Prefix, Root, Structure, Transl_F, TypeOfWord, Word, DateEntryWord: new Date()
      }
    });
    return de;
  } catch (error) {
    console.error('Error creating Deutsch:', error);
    throw error;
  }
}

// UPDATE
export const updateDeutsch = async (id, Article, Artikel, Definition, Prefix, Root, Structure, Transl_F, TypeOfWord, Word) => {
  try {
    if (!id || !Word || typeof Word !== 'string') {
      throw new Error('Invalid input');
    }
    const de = await prisma.deutschs.update({
      where: { id: id },
      data: {
        Article, Artikel, Definition, Prefix, Root, Structure, Transl_F, TypeOfWord, Word, DateEntryWord: new Date()
      }
    });
    return de;
  } catch (error) {
    console.error('Error updating Deutsch:', error);
    throw error;
  }
}

// READ
export const getDeutsch = async () => {
  try {
    const deutsch = await prisma.deutschs.findMany();
    return deutsch;
  } catch (error) {
    console.error('Error fetching Deutsch:', error);
    throw error;
  }
}
