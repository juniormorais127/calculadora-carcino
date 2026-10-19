import { readFileSync, appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
export function androidBuildVersion(version, runNumber) {
  const run = Number(runNumber), code = 1000 + run;
  if (!/^\d+\.\d+\.\d+$/.test(version) || !Number.isSafeInteger(run) || run < 1 || code > 2100000000) throw new Error('Invalid Android build version');
  return { code, name: `${version}-teste` };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
  const result = androidBuildVersion(version, process.env.GITHUB_RUN_NUMBER);
  appendFileSync(process.env.GITHUB_ENV, `ANDROID_VERSION_CODE=${result.code}\nANDROID_VERSION_NAME=${result.name}\n`);
  appendFileSync(process.env.GITHUB_OUTPUT, `code=${result.code}\nname=${result.name}\n`);
}
