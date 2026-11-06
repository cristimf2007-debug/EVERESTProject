const { PrismaClient } = require('@prisma/client');
const { hashPassword, verifyPassword } = require('../src/lib/auth');

const prisma = new PrismaClient();

async function main() {
  const configuredEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!configuredEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(configuredEmail) ||
      !adminPassword || Buffer.byteLength(adminPassword) < 16 || Buffer.byteLength(adminPassword) > 72) {
    throw new Error('Set a valid ADMIN_EMAIL and a unique ADMIN_PASSWORD between 16 and 72 bytes');
  }
  const adminEmail = configuredEmail.toLowerCase().trim();
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password_hash: hashPassword(adminPassword),
        role: 'admin',
        bio: 'Administrator BIOXIC',
      },
    });
  } else if (existingAdmin.role !== 'admin') {
    throw new Error('ADMIN_EMAIL belongs to a non-admin account; resolve the account explicitly');
  } else if (!existingAdmin.password_hash || !verifyPassword(adminPassword, existingAdmin.password_hash)) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { password_hash: hashPassword(adminPassword) },
    });
  }
  console.log('✅ Admin configurat:', adminEmail);

  // Demo tracks
  const track1 = await prisma.track.create({
    data: {
      title: 'Demo Track 1',
      artist: 'BIOXIC',
      genre: 'Electronic',
      tags: ['demo', 'electronic'],
      audio_url: 'https://example.com/audio1.mp3',
      cover_url: 'https://example.com/cover1.jpg',
      plays: 0,
      likes: 0,
      duration: 180,
    },
  });

  const track2 = await prisma.track.create({
    data: {
      title: 'Demo Track 2',
      artist: 'BIOXIC',
      genre: 'Rock',
      tags: ['demo', 'rock'],
      audio_url: 'https://example.com/audio2.mp3',
      cover_url: 'https://example.com/cover2.jpg',
      plays: 0,
      likes: 0,
      duration: 210,
    },
  });
  console.log('✅ Demo tracks create:', track1.title, track2.title);

  // Demo site content
  await prisma.siteContent.upsert({
    where: { key: 'site_title' },
    update: {},
    create: { key: 'site_title', value: 'BIOXIC Radio' },
  });
  console.log('✅ Conținut site inițializat');

  // Demo announcement
  await prisma.announcement.create({
    data: {
      title: 'Bun venit pe BIOXIC!',
      content: 'Migrarea la PostgreSQL s-a finalizat cu succes.',
      is_active: true,
    },
  });
  console.log('✅ Anunț demo creat');

  console.log('🎉 Seed finalizat cu succes!');
}

main()
  .catch((e) => {
    console.error('❌ Eroare la seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
