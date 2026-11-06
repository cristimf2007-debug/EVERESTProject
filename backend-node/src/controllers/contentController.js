const prisma = require('../lib/prisma');

async function getContent(req, res) {
  const items = await prisma.siteContent.findMany();
  const obj = {};
  for (const item of items) obj[item.key] = item.value;
  return res.json(obj);
}

module.exports = { getContent };
