const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');

const STORAGE_ROOT = path.resolve(process.env.BIOXIC_STORAGE_DIR || path.join(__dirname, '..', '..', 'uploads'));
const CONTENT_TYPES = new Map([
  ['.mp3', 'audio/mpeg'], ['.wav', 'audio/wav'], ['.ogg', 'audio/ogg'], ['.m4a', 'audio/mp4'],
  ['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg'], ['.png', 'image/png'], ['.webp', 'image/webp'],
  ['.mp4', 'video/mp4'], ['.mov', 'video/quicktime'], ['.webm', 'video/webm'],
]);

function resolveStoragePath(storagePath) {
  if (typeof storagePath !== 'string' || !storagePath || storagePath.includes('\\')) {
    throw new TypeError('Invalid storage path');
  }
  const parts = storagePath.split('/');
  if (parts.some((part) => !part || part === '.' || part === '..') || path.posix.isAbsolute(storagePath)) {
    throw new TypeError('Invalid storage path');
  }
  const target = path.resolve(STORAGE_ROOT, ...parts);
  const relative = path.relative(STORAGE_ROOT, target);
  if (relative.startsWith(`..${path.sep}`) || relative === '..' || path.isAbsolute(relative)) {
    throw new TypeError('Invalid storage path');
  }
  return target;
}

async function putObject(storagePath, data, contentType) {
  const target = resolveStoragePath(storagePath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, data, { flag: 'wx' });
    await fs.rename(temporary, target);
  } finally {
    await fs.rm(temporary, { force: true });
  }
  return { path: storagePath, size: data.length, contentType };
}

async function getObject(storagePath) {
  const target = resolveStoragePath(storagePath);
  const data = await fs.readFile(target);
  return { data, contentType: CONTENT_TYPES.get(path.extname(target).toLowerCase()) || 'application/octet-stream' };
}

module.exports = { putObject, getObject };
