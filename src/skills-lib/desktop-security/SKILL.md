---
name: desktop-security
description: >
  Segurança para apps desktop e Electron. Usar quando: desenvolver app Electron, configurar contextIsolation/IPC,
  implementar code signing, armazenar tokens/credenciais localmente, configurar auto-update seguro,
  distribuir app para macOS/Windows. Use quando o usuário mencionar Electron, IPC, contextBridge,
  preload script, safeStorage, code signing, notarização ou auto-update.
---

# Desktop Security

## Electron / Apps Desktop

### Contexto de segurança
- nodeIntegration: false (padrão desde Electron 5, mantenha assim)
- contextIsolation: true (obrigatório)
- sandbox: true quando possível
- webSecurity: false nunca em produção
- Nunca carregue conteúdo remoto numa janela com acesso a APIs privilegiadas; conteúdo remoto = sandbox + sem preload sensível
- Mantenha o Electron atualizado (patches de Chromium/Node chegam por release do Electron)

### Navegação e janelas
- Bloqueie navegação para fora do app: handler em `will-navigate` que cancela URLs fora da allowlist
- `setWindowOpenHandler`: negue por padrão (`{ action: "deny" }`), abra externo só o que for aprovado
- `shell.openExternal` só com URL validada (esquema `https:` e host esperado), nunca com input cru do renderer

### IPC (comunicação renderer <> main)
- Valide e sanitize todos os dados vindos do renderer (o renderer é território hostil: trate como input de usuário)
- Exponha apenas as funções necessárias via contextBridge, cada uma com assinatura fixa
- Nunca exponha ipcRenderer diretamente ao renderer
- Em `ipcMain.handle`, valide tipo e tamanho dos argumentos; se houver múltiplas janelas, cheque `event.senderFrame.url` contra o esperado

```ts
// preload.ts: superfície mínima, sem repassar ipcRenderer
contextBridge.exposeInMainWorld("api", {
  saveNote: (text: string) => ipcRenderer.invoke("notes:save", text),
})

// main.ts: valida antes de agir
ipcMain.handle("notes:save", (event, text) => {
  if (typeof text !== "string" || text.length > 10_000) throw new Error("input inválido")
  // ...
})
```

### Atualizações automáticas
- Assine o pacote de atualização com certificado de código (code signing)
- Valide assinatura antes de instalar atualização
- Distribua via HTTPS com certificate pinning se possível

## Armazenamento local

### O que armazenar localmente
- Tokens de sessão: `safeStorage` do Electron (usa Keychain no macOS, DPAPI no Windows, libsecret no Linux), nunca localStorage
  - `safeStorage.encryptString(token)` antes de gravar em disco; `keytar` está arquivado, não use em projeto novo
- Dados sensíveis do usuário: criptografados via `safeStorage` ou AES-256-GCM com chave guardada no keychain do OS

### O que nunca armazenar localmente
- Senhas em texto plano
- Chaves privadas sem criptografia
- Dados sensíveis em localStorage/sessionStorage sem criptografia

## Distribuição
- Code signing obrigatório (Windows: Authenticode, macOS: Apple Developer ID)
- Notarização no macOS para distribuição fora da App Store
- Auto-update com verificação de integridade antes de executar

## Checklist rápido (antes de empacotar)
- [ ] `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` onde possível?
- [ ] Nenhuma janela privilegiada carrega URL remota?
- [ ] `will-navigate` e `setWindowOpenHandler` restringem navegação?
- [ ] Todo handler de `ipcMain` valida os argumentos?
- [ ] Tokens em `safeStorage`/keychain, nada sensível em localStorage?
- [ ] Build assinado (e notarizado no macOS)? Auto-update valida assinatura?
- [ ] Versão do Electron atual (sem CVE aberta)?
