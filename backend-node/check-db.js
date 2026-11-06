const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const [users, tracks, announcements, radio, live, tv] = await Promise.all([
    prisma.$queryRawUnsafe('SELECT count(*) as cnt FROM users'),
    prisma.$queryRawUnsafe('SELECT count(*) as cnt FROM tracks'),
    prisma.$queryRawUnsafe('SELECT count(*) as cnt FROM announcements'),
    prisma.$queryRawUnsafe('SELECT count(*) as cnt FROM radio'),
    prisma.$queryRawUnsafe('SELECT count(*) as cnt FROM live'),
    prisma.$queryRawUnsafe('SELECT count(*) as cnt FROM tv_schedule'),
  ]);
  console.log('✅ Baza de date funcțională:');
  console.log(`   👥 Utilizatori: ${users[0].cnt}`);
  console.log(`   🎵 Piese: ${tracks[0].cnt}`);
  console.log(`   📢 Anunțuri: ${announcements[0].cnt}`);
  console.log(`   📻 Radio: ${radio[0].cnt}`);
  console.log(`   🔴 Live: ${live[0].cnt}`);
  console.log(`   📺 TV Schedule: ${tv[0].cnt}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Eroare:', e.message);
  process.exit(1);
});
