import fs from 'node:fs';
import path from 'node:path';

const uploadSubdirectories = ['temp', 'profile-images', 'professional-images', 'cvs', 'general'];

export function getUploadRoot() {
  return path.resolve(process.env.UPLOAD_DIR || 'uploads');
}

export function ensureUploadVolumeReady() {
  const root = getUploadRoot();
  fs.mkdirSync(root, { recursive: true });
  for (const directory of uploadSubdirectories) fs.mkdirSync(path.join(root, directory), { recursive: true });
  const probe = path.join(root, `.write-test-${process.pid}`);
  try {
    fs.writeFileSync(probe, `${new Date().toISOString()}\n`, { flag: 'wx' });
    fs.unlinkSync(probe);
  } catch (error) {
    try { fs.unlinkSync(probe); } catch { /* best effort cleanup */ }
    throw new Error(`Upload volume is not writable: ${root}`, { cause: error });
  }
  return root;
}
