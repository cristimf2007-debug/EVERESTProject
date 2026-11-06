const prisma = require('../lib/prisma');

async function createContact(req, res) {
  const { name, email, subject, message } = req.body || {};
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const cleanSubject = typeof subject === 'string' ? subject.trim() : '';
  const cleanMessage = typeof message === 'string' ? message.trim() : '';

  if (!cleanName || !cleanEmail || !cleanSubject || !cleanMessage) {
    return res.status(400).json({ detail: 'Toate câmpurile sunt necesare' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ detail: 'Email invalid' });
  }
  if (cleanName.length > 60 || cleanEmail.length > 120 || cleanSubject.length > 180 || cleanMessage.length > 2000) {
    return res.status(400).json({ detail: 'Mesajul depășește limita permisă' });
  }

  const contact = await prisma.contact.create({
    data: { name: cleanName, email: cleanEmail, subject: cleanSubject, message: cleanMessage },
  });
  return res.status(201).json(contact);
}

module.exports = { createContact };
