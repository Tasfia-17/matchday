import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding MatchDay database...');

  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@matchday.gg' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@matchday.gg',
      password: adminPassword,
      role: 'ADMIN',
      emailVerified: true,
      totalXP: 9999,
      level: 99,
    },
  });

  // Demo fan user
  const fanPassword = await bcrypt.hash('fan123', 12);
  await prisma.user.upsert({
    where: { email: 'fan@matchday.gg' },
    update: {},
    create: {
      username: 'superfan',
      email: 'fan@matchday.gg',
      password: fanPassword,
      emailVerified: true,
      totalXP: 420,
      level: 5,
    },
  });

  // Seed upcoming match events (demo data)
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(now);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const demoMatches = [
    {
      sport: 'football',
      league: 'English Premier League',
      homeTeam: 'Manchester City',
      awayTeam: 'Arsenal',
      status: 'SCHEDULED' as const,
      scheduledAt: tomorrow,
      venue: 'Etihad Stadium',
    },
    {
      sport: 'football',
      league: 'English Premier League',
      homeTeam: 'Liverpool',
      awayTeam: 'Chelsea',
      status: 'SCHEDULED' as const,
      scheduledAt: tomorrow,
      venue: 'Anfield',
    },
    {
      sport: 'basketball',
      league: 'NBA',
      homeTeam: 'LA Lakers',
      awayTeam: 'Golden State Warriors',
      status: 'SCHEDULED' as const,
      scheduledAt: dayAfter,
      venue: 'Crypto.com Arena',
    },
    {
      sport: 'football',
      league: 'Champions League',
      homeTeam: 'Real Madrid',
      awayTeam: 'Barcelona',
      status: 'LIVE' as const,
      scheduledAt: now,
      homeScore: 1,
      awayScore: 0,
      venue: 'Santiago Bernabéu',
    },
  ];

  for (const match of demoMatches) {
    await prisma.matchEvent.upsert({
      where: {
        externalId: `demo-${match.homeTeam}-${match.awayTeam}`.replace(/\s+/g, '-').toLowerCase(),
      },
      update: {},
      create: {
        ...match,
        externalId: `demo-${match.homeTeam}-${match.awayTeam}`.replace(/\s+/g, '-').toLowerCase(),
      },
    });
  }

  // Seed demo fan clubs
  await prisma.fanClub.upsert({
    where: { id: 'fanclub-united' },
    update: {},
    create: {
      id: 'fanclub-united',
      name: 'The Red Army',
      sport: 'football',
      teamName: 'Manchester United',
      description: 'The global fan club for United supporters',
      badge: '🔴',
      primaryColor: '#dc2626',
    },
  });

  await prisma.fanClub.upsert({
    where: { id: 'fanclub-lakers' },
    update: {},
    create: {
      id: 'fanclub-lakers',
      name: 'Laker Nation',
      sport: 'basketball',
      teamName: 'LA Lakers',
      description: 'Purple and gold forever',
      badge: '💜',
      primaryColor: '#7c3aed',
    },
  });

  console.log('✅ Seed complete');
  console.log('   Admin: admin@matchday.gg / admin123');
  console.log('   Fan:   fan@matchday.gg / fan123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
