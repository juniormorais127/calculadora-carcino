import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { validateAndroidRelease, ANDROID_APP_ID } from '../src/services/androidRelease.js';
const code = Number(process.env.ANDROID_VERSION_CODE), name = process.env.ANDROID_VERSION_NAME;
if (!/^\d+\.\d+\.\d+-teste$/.test(name || '')) throw new Error('Invalid version name');
const tag = `android-teste-${name}-b${code}`;
const downloadUrl = `https://github.com/juniormorais127/calculadora-carcino/releases/download/${tag}/CarcinoGestao-teste.apk`;
const release = validateAndroidRelease({ schema: 1, appId: ANDROID_APP_ID, versionCode: code, versionName: name, downloadUrl });
const current = validateAndroidRelease(JSON.parse(readFileSync('public/android-release.json', 'utf8')));
if (current.versionCode >= code) { console.log('Published channel already has this build or a newer one.'); process.exit(0); }
const gh = args => execFileSync('gh', args, { stdio: 'inherit' });
const git = args => execFileSync('git', args, { stdio: 'inherit' });
const apk = 'apk/CarcinoGestao-teste.apk';
const sha256 = createHash('sha256').update(readFileSync(apk)).digest('hex');
writeFileSync('apk/SHA256.txt', `${sha256}  CarcinoGestao-teste.apk\n`);
writeFileSync('apk/release-notes.md', `# CarcinoGestão ${name} (compilação ${code})\n\nAPK de testes validado no emulador Android.\n\nInstale por cima da versão anterior, sem desinstalar nem limpar os dados, para preservar fotos e relatórios locais. Após baixar, abra Arquivos → Downloads → CarcinoGestao-teste.apk → Atualizar. Se solicitado, autorize a instalação por esse navegador.\n\nA versão web continua disponível em https://juniormorais127.github.io/calculadora-carcino/ para qualquer dispositivo com navegador. O APK é opcional. O aplicativo verifica novas versões ao abrir e ao voltar para ele, com conexão.\n\nOrigem: ${process.env.APK_SOURCE_SHA}\nSHA256: ${sha256}\n`);
const existing = spawnSync('gh', ['release', 'view', tag], { stdio: 'ignore' });
if (existing.status !== 0) gh(['release', 'create', tag, '--draft', '--prerelease', '--target', process.env.APK_SOURCE_SHA, '--title', `CarcinoGestao ${name} - build ${code}`, '--notes-file', 'apk/release-notes.md']);
gh(['release', 'upload', tag, apk, 'apk/SHA256.txt', '--clobber']);
gh(['release', 'edit', tag, '--draft=false', '--prerelease', '--notes-file', 'apk/release-notes.md']);
let reachable = false;
for (let attempt = 0; attempt < 3; attempt++) {
  const response = await fetch(downloadUrl, { method: 'HEAD' });
  if (response.ok) { reachable = true; break; }
  await new Promise(resolve => setTimeout(resolve, 1500));
}
if (!reachable) throw new Error('APK is not publicly downloadable; channel metadata was not changed.');
writeFileSync('public/android-release.json', JSON.stringify({ ...release, sha256, publishedAt: new Date().toISOString() }, null, 2) + '\n');
git(['config', 'user.name', 'github-actions[bot]']);
git(['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);
git(['add', 'public/android-release.json']);
git(['commit', '-m', `chore: publicar APK Android build ${code}`]);
git(['push', 'origin', 'HEAD:master']);
appendFileSync(process.env.GITHUB_OUTPUT, 'metadata_changed=true\n');
