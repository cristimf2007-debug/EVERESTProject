const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, test } = require('node:test');

const storageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bioxic-storage-'));
process.env.BIOXIC_STORAGE_DIR = storageRoot;
const { getObject, putObject } = require('./storage');

after(() => fs.rmSync(storageRoot, { recursive: true, force: true }));

test('local storage round-trips uploaded objects', async () => {
  const result = await putObject('bioxic/uploads/audio/track.mp3', Buffer.from('audio'), 'audio/mpeg');

  assert.equal(result.path, 'bioxic/uploads/audio/track.mp3');
  assert.equal(result.size, 5);
  assert.deepEqual(await getObject(result.path), {
    data: Buffer.from('audio'),
    contentType: 'audio/mpeg',
  });
});

test('local storage rejects paths outside its root', async () => {
  await assert.rejects(putObject('../outside.txt', Buffer.from('no'), 'text/plain'), /Invalid storage path/);
  assert.equal(fs.existsSync(path.join(storageRoot, 'outside.txt')), false);
});
