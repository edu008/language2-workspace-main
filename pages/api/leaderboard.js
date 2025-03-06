import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Starting leaderboard query...');
    // Gruppiere nach Benutzer und zähle die Anzahl der 'correct: 2' Einträge
    const leaderboardData = await prisma.standing.groupBy({
      by: ['user'],
      _count: {
        id: true, // Zähle die Anzahl der Einträge pro Benutzer
      },
      where: {
        correct: 2, // Nur Einträge mit 'gelernt' zählen
      },
    });

    console.log('Raw leaderboard data:', leaderboardData);

    // Hole die Benutzerdetails aus 'users'
    const userEmails = leaderboardData.map((entry) => entry.user);
    const usersData = await prisma.users.findMany({
      where: {
        email: { in: userEmails },
      },
      select: {
        email: true,
        name: true,
        image: true,
      },
    });

    console.log('Users data:', usersData);

    // Kombiniere die Daten
    const leaderboard = leaderboardData.map((entry) => {
      const user = usersData.find((u) => u.email === entry.user);
      if (!user) {
        throw new Error(`No user found for email: ${entry.user}`);
      }
      return {
        id: entry.user,
        name: user.name,
        image: user.image,
        score: entry._count.id, // Anzahl der 'correct: 2' Einträge
        position: 0,
      };
    });

    // Setze die Positionen
    leaderboard.sort((a, b) => b.score - a.score).forEach((user, index) => {
      user.position = index + 1;
    });

    console.log('Final leaderboard:', leaderboard);
    res.status(200).json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}