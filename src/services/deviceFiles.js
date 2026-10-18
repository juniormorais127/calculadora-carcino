import { Capacitor } from '@capacitor/core';
export const isNativeApp = () => Capacitor.isNativePlatform();
export async function blobBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(blob);
  });
}
export async function saveDeviceFile(blob, filename) {
  filename = filename.replace(/[^\p{L}\p{N}._-]/gu, '-').slice(0, 160);
  if (isNativeApp()) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
    // Keep reports outside the temporary share cache; no broad storage permission.
    const path = `CarcinoGestao/${Date.now()}-${filename}`;
    await Filesystem.writeFile({ path, directory: Directory.Documents, data: await blobBase64(blob), recursive: true });
    const { uri } = await Filesystem.getUri({ path, directory: Directory.Documents });
    try { await Share.share({ title: filename, files: [uri] }); }
    catch { /* Canceling the share sheet does not remove the saved document. */ }
    return;
  }
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
