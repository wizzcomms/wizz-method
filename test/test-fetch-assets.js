/**
 * fetch-assets Tests (Tarefa 2.8 da auditoria — assets lazy)
 *
 * Cobre tools/fetch-assets.mjs, o downloader sob demanda que substitui os
 * ~30MB de MP3 (huashu-design/assets/) e ~5.5MB de fontes (canvas-design/
 * canvas-fonts/) removidos do pacote npm (Tarefa 2.8). Os arquivos continuam
 * no repo git; o downloader é o mecanismo que os restaura quando o pacote
 * npm publicado (sem eles) precisa do recurso real (BGM/SFX de export de
 * vídeo, ou uma fonte específica do canvas-design).
 *
 * O script é ESM (irmão de tools/sync-check.mjs), então roda como subprocess
 * via `node tools/fetch-assets.mjs --url ... --sha256 ... --dest ...`
 * (mesmo modo "explícito" que o CLI expõe para permitir teste sem depender
 * da release do GitHub existir) — mesmo padrão de test/test-sync-check.js.
 * Um servidor HTTP local descartável faz o papel do GitHub Release.
 *
 * Cenários cobertos (pedidos pelo spec da tarefa):
 *   1. sha256 correto → extrai com sucesso.
 *   2. sha256 errado → aborta sem escrever nada no destino.
 *   3. arquivos já existentes (marcador presente) → não rebaixa (cache hit,
 *      servidor não recebe segunda requisição).
 *   4. --force → ignora o cache e rebaixa mesmo com o marcador presente.
 *
 * Usage: node test/test-fetch-assets.js
 */

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const crypto = require('node:crypto');
const { execFileSync, execFile } = require('node:child_process');

const SCRIPT = path.join(__dirname, '..', 'tools', 'fetch-assets.mjs');

let passed = 0;
let failed = 0;

function assert(condition, name, detail = '') {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

/** Cria um .tar.gz mínimo (1 arquivo texto) com `tar`, o mesmo binário que fetch-assets.mjs usa para extrair. */
function makeFixtureTarball(tmpDir, fileContent) {
  const stageDir = fs.mkdtempSync(path.join(tmpDir, 'stage-'));
  fs.writeFileSync(path.join(stageDir, 'marker.txt'), fileContent);
  const tarPath = path.join(tmpDir, `fixture-${crypto.randomBytes(4).toString('hex')}.tar.gz`);
  execFileSync('tar', ['-czf', tarPath, '-C', stageDir, 'marker.txt']);
  const sha256 = crypto.createHash('sha256').update(fs.readFileSync(tarPath)).digest('hex');
  return { tarPath, sha256 };
}

/** Sobe um servidor HTTP local servindo `filePath` em qualquer path; conta quantos GETs recebeu. */
function serveFile(filePath) {
  const state = { hits: 0 };
  const server = http.createServer((req, res) => {
    state.hits += 1;
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': 'application/gzip' });
    res.end(data);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, url: `http://127.0.0.1:${port}/bundle.tar.gz`, state });
    });
  });
}

// execFile (assíncrono), não execFileSync: o mock server abaixo roda no MESMO
// processo deste teste, então uma chamada síncrona bloquearia o event loop
// inteiro e o server nunca conseguiria responder à requisição do subprocess
// (o subprocess trava até o timeout do fetch-assets.mjs). Async mantém o
// event loop livre para o server atender enquanto o subprocess está de pé.
function runFetchAssets(args) {
  return new Promise((resolve) => {
    execFile('node', [SCRIPT, ...args], { encoding: 'utf8' }, (error, stdout, stderr) => {
      if (error) {
        resolve({ status: error.code ?? 1, stdout: `${stdout || ''}${stderr || ''}` });
      } else {
        resolve({ status: 0, stdout: `${stdout || ''}${stderr || ''}` });
      }
    });
  });
}

async function main() {
  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'wizz-fetch-assets-test-'));

  console.log('test-fetch-assets: sha256 correto extrai com sucesso');
  {
    const { tarPath, sha256 } = makeFixtureTarball(tmpBase, 'conteudo-valido');
    const { server, url } = await serveFile(tarPath);
    const dest = path.join(tmpBase, 'dest-ok');
    const result = await runFetchAssets(['--url', url, '--sha256', sha256, '--dest', dest, '--marker', 'marker.txt']);
    server.close();

    assert(result.status === 0, 'exit code 0', result.stdout);
    assert(fs.existsSync(path.join(dest, 'marker.txt')), 'marker.txt extraído no destino');
    assert(fs.readFileSync(path.join(dest, 'marker.txt'), 'utf8') === 'conteudo-valido', 'conteúdo extraído bate com o original');
  }

  console.log('test-fetch-assets: sha256 errado aborta sem escrever nada');
  {
    const { tarPath } = makeFixtureTarball(tmpBase, 'conteudo-qualquer');
    const wrongSha256 = 'a'.repeat(64);
    const { server, url } = await serveFile(tarPath);
    const dest = path.join(tmpBase, 'dest-bad-sha');
    const result = await runFetchAssets(['--url', url, '--sha256', wrongSha256, '--dest', dest, '--marker', 'marker.txt']);
    server.close();

    assert(result.status !== 0, 'exit code != 0 em sha256 divergente');
    assert(!fs.existsSync(dest), 'destino não foi criado (nada extraído)');
    assert(/sha256 não confere/i.test(result.stdout), 'mensagem de erro cita sha256 divergente', result.stdout);
  }

  console.log('test-fetch-assets: cache hit não rebaixa (marcador já presente)');
  {
    const { tarPath, sha256 } = makeFixtureTarball(tmpBase, 'conteudo-cache');
    const dest = path.join(tmpBase, 'dest-cache');
    fs.mkdirSync(dest, { recursive: true });
    fs.writeFileSync(path.join(dest, 'marker.txt'), 'ja-existia');

    const { server, url, state } = await serveFile(tarPath);
    const result = await runFetchAssets(['--url', url, '--sha256', sha256, '--dest', dest, '--marker', 'marker.txt']);
    server.close();

    assert(result.status === 0, 'exit code 0 em cache hit', result.stdout);
    assert(state.hits === 0, 'servidor não recebeu nenhuma requisição (cache evitou o download)');
    assert(fs.readFileSync(path.join(dest, 'marker.txt'), 'utf8') === 'ja-existia', 'arquivo pré-existente não foi sobrescrito');
    assert(/cache/i.test(result.stdout), 'mensagem indica cache hit', result.stdout);
  }

  console.log('test-fetch-assets: --force ignora cache e rebaixa');
  {
    const { tarPath, sha256 } = makeFixtureTarball(tmpBase, 'conteudo-forcado');
    const dest = path.join(tmpBase, 'dest-force');
    fs.mkdirSync(dest, { recursive: true });
    fs.writeFileSync(path.join(dest, 'marker.txt'), 'sera-substituido');

    const { server, url, state } = await serveFile(tarPath);
    const result = await runFetchAssets(['--url', url, '--sha256', sha256, '--dest', dest, '--marker', 'marker.txt', '--force']);
    server.close();

    assert(result.status === 0, 'exit code 0 com --force', result.stdout);
    assert(state.hits === 1, '--force força 1 requisição ao servidor mesmo com marcador presente');
    assert(fs.readFileSync(path.join(dest, 'marker.txt'), 'utf8') === 'conteudo-forcado', '--force sobrescreve o conteúdo antigo');
  }

  console.log('test-fetch-assets: bundle nomeado desconhecido reporta erro claro');
  {
    const result = await runFetchAssets(['bundle-que-nao-existe']);
    assert(result.status !== 0, 'exit code != 0 para bundle desconhecido');
    assert(/[Bb]undle desconhecido/.test(result.stdout), 'mensagem cita bundle desconhecido', result.stdout);
  }

  fs.rmSync(tmpBase, { recursive: true, force: true });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exitCode = failed > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error('Erro inesperado no runner de teste:', error);
  process.exitCode = 1;
});
