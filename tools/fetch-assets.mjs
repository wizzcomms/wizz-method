// fetch-assets.mjs — downloader sob demanda dos assets pesados (MP3/fontes)
// removidos do pacote npm na Tarefa 2.8 da auditoria (assets lazy).
//
// Por que existe: `huashu-design/assets/**/*.mp3` (~30MB) e
// `canvas-design/canvas-fonts/**/*.ttf` (~5.5MB) inflavam o pacote npm em
// ~73%, mas só são necessários no primeiro uso real de export de vídeo
// (BGM/SFX) ou de uma variante de fonte específica. Os arquivos continuam no
// git (fonte de verdade); só saem do tarball publicado. Este script baixa o
// bundle certo, no lugar certo, verificando sha256 (mesmo espírito do pin
// com checksum do rtk — nunca extrai um bundle adulterado).
//
// Uso:
//   node tools/fetch-assets.mjs <bundle> [--dest <dir>] [--force]
//   node tools/fetch-assets.mjs --all
//   node tools/fetch-assets.mjs --url <url> --sha256 <hash> --dest <dir> [--marker <file>] [--force]
//
// Bundles conhecidos: huashu-audio, canvas-fonts (ver BUNDLES abaixo).
//
// Cache: se o arquivo-marcador do bundle já existe no destino, não baixa de
// novo (a menos que --force). Sem dependência nova: usa `node:https`/
// `node:http` para o download e o binário `tar` do sistema (macOS/Linux/WSL,
// mesmo escopo de suporte declarado do resto do framework) para extrair.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import https from 'node:https';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, '..');

const RELEASE_BASE = 'https://github.com/wizzcomms/wizz-method/releases/download/assets-v1';

// Fonte única dos bundles conhecidos. `dest` é relativo ao root do pacote
// (repo em dev, node_modules/wizz-method quando instalado via npm — a mesma
// árvore src/skills-lib/ existe nos dois casos). `marker` é um arquivo que só
// existe depois de extraído com sucesso; presença dele = cache hit.
export const BUNDLES = {
  'huashu-audio': {
    url: `${RELEASE_BASE}/huashu-audio.tar.gz`,
    sha256: 'd20ddaefb7fd560837dec8d57ae8698ee51ef553d61a1367f0491183c613129f',
    dest: 'src/skills-lib/huashu-design/assets',
    marker: 'bgm-ad.mp3',
    description: '6 trilhas BGM + SFX (huashu-design/assets/**/*.mp3, ~27MB)',
  },
  'canvas-fonts': {
    url: `${RELEASE_BASE}/canvas-fonts.tar.gz`,
    sha256: '7ac839f1dee2883b8e9a7022f246cfece4e203a2fd6ea23c81a5ffa49b812396',
    dest: 'src/skills-lib/canvas-design/canvas-fonts',
    marker: 'Outfit-Regular.ttf',
    description: '~54 variantes de fonte (canvas-design/canvas-fonts/*.ttf, ~2.5MB)',
  },
};

const NETWORK_ERROR_CODES = new Set(['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN', 'ENETUNREACH']);

function isNetworkError(err) {
  return Boolean(err && (NETWORK_ERROR_CODES.has(err.code) || err.name === 'AbortError'));
}

/** Baixa `url` para `destFile`, seguindo redirects (GitHub release assets fazem 302). */
function download(url, destFile, { maxRedirects = 5, timeoutMs = 30_000 } = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, { timeout: timeoutMs }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        if (maxRedirects <= 0) {
          reject(new Error(`Muitos redirects ao baixar ${url}`));
          return;
        }
        const nextUrl = new URL(res.headers.location, url).toString();
        download(nextUrl, destFile, { maxRedirects: maxRedirects - 1, timeoutMs }).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode} ao baixar ${url}`));
        return;
      }
      const fileStream = fs.createWriteStream(destFile);
      res.pipe(fileStream);
      fileStream.on('finish', () => fileStream.close(() => resolve()));
      fileStream.on('error', reject);
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error(`Timeout ao baixar ${url}`)));
    req.on('error', reject);
  });
}

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

function extractTarGz(tarFile, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  execFileSync('tar', ['-xzf', tarFile, '-C', destDir], { stdio: 'pipe' });
}

function isCached(destDir, marker) {
  if (!marker) {
    return fs.existsSync(destDir) && fs.readdirSync(destDir).length > 0;
  }
  return fs.existsSync(path.join(destDir, marker));
}

/**
 * Baixa, verifica sha256 e extrai um bundle. Não escreve nada no destino se
 * o sha256 não bater (aborta antes do extract). Cache: pula o download se o
 * marcador já existir em `dest`, a menos que `force`.
 *
 * @returns {Promise<{ cached: boolean }>}
 */
export async function fetchBundle({ url, sha256, dest, marker, force = false }) {
  const destDir = path.isAbsolute(dest) ? dest : path.join(PACKAGE_ROOT, dest);

  if (!force && isCached(destDir, marker)) {
    return { cached: true, dest: destDir };
  }

  const tmpFile = path.join(os.tmpdir(), `wizz-fetch-assets-${crypto.randomBytes(6).toString('hex')}.tar.gz`);
  try {
    await download(url, tmpFile);
  } catch (error) {
    fs.rmSync(tmpFile, { force: true });
    if (isNetworkError(error)) {
      throw new FetchAssetsError(
        `Sem conexão para baixar o asset (${error.code || error.message}).\n` +
          `  Baixe manualmente: ${url}\n` +
          `  E extraia em: ${destDir}`,
        { cause: error },
      );
    }
    throw error;
  }

  const actualSha256 = await sha256File(tmpFile);
  if (actualSha256 !== sha256) {
    fs.rmSync(tmpFile, { force: true });
    throw new FetchAssetsError(
      `sha256 não confere para ${url}\n  esperado: ${sha256}\n  obtido:   ${actualSha256}\n` +
        `Download abortado, nada foi extraído (bundle pode estar corrompido ou adulterado).`,
    );
  }

  try {
    extractTarGz(tmpFile, destDir);
  } finally {
    fs.rmSync(tmpFile, { force: true });
  }

  return { cached: false, dest: destDir };
}

export class FetchAssetsError extends Error {}

async function fetchNamedBundle(name, { dest, force } = {}) {
  const bundle = BUNDLES[name];
  if (!bundle) {
    throw new FetchAssetsError(`Bundle desconhecido: "${name}". Disponíveis: ${Object.keys(BUNDLES).join(', ')}`);
  }
  return fetchBundle({
    url: bundle.url,
    sha256: bundle.sha256,
    dest: dest || bundle.dest,
    marker: bundle.marker,
    force,
  });
}

function parseArgs(argv) {
  const opts = { positional: [], force: false, all: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--force': {
        opts.force = true;
        break;
      }
      case '--all': {
        opts.all = true;
        break;
      }
      case '--dest': {
        opts.dest = argv[++i];
        break;
      }
      case '--url': {
        opts.url = argv[++i];
        break;
      }
      case '--sha256': {
        opts.sha256 = argv[++i];
        break;
      }
      case '--marker': {
        opts.marker = argv[++i];
        break;
      }
      default: {
        opts.positional.push(arg);
      }
    }
  }
  return opts;
}

async function main(argv) {
  const opts = parseArgs(argv);

  if (opts.all) {
    let exitCode = 0;
    for (const name of Object.keys(BUNDLES)) {
      try {
        const result = await fetchNamedBundle(name, { force: opts.force });
        console.log(result.cached ? `✓ ${name}: já em cache (${result.dest})` : `✓ ${name}: baixado em ${result.dest}`);
      } catch (error) {
        exitCode = 1;
        console.error(`✗ ${name}: ${error.message}`);
      }
    }
    process.exitCode = exitCode;
    return;
  }

  if (opts.url && opts.sha256 && opts.dest) {
    try {
      const result = await fetchBundle({ url: opts.url, sha256: opts.sha256, dest: opts.dest, marker: opts.marker, force: opts.force });
      console.log(result.cached ? `✓ já em cache (${result.dest})` : `✓ baixado em ${result.dest}`);
    } catch (error) {
      console.error(`✗ ${error.message}`);
      process.exitCode = 1;
    }
    return;
  }

  const bundleName = opts.positional[0];
  if (!bundleName) {
    console.error(
      'Uso: node tools/fetch-assets.mjs <bundle> [--dest <dir>] [--force]\n' +
        '     node tools/fetch-assets.mjs --all\n' +
        `Bundles: ${Object.entries(BUNDLES)
          .map(([id, b]) => `\n  ${id} — ${b.description}`)
          .join('')}`,
    );
    process.exitCode = 1;
    return;
  }

  try {
    const result = await fetchNamedBundle(bundleName, { dest: opts.dest, force: opts.force });
    console.log(result.cached ? `✓ ${bundleName}: já em cache (${result.dest})` : `✓ ${bundleName}: baixado em ${result.dest}`);
  } catch (error) {
    console.error(`✗ ${error.message}`);
    process.exitCode = 1;
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(`✗ Erro inesperado: ${error.stack || error.message}`);
    process.exitCode = 1;
  });
}
