# Pesquisa de Público do Piva — skill para Claude

Transforma **um documento de oferta** em um arsenal completo de pesquisa de público para tráfego pago: seis relatórios encadeados (VoC, Perfil Psicográfico, Níveis de Consciência, Trend, Matriz de Ângulos e Léxico) compilados num HTML navegável por abas, pronto para entregar ao cliente ou usar como base de copy.

Feito por **[@soupiva](https://www.instagram.com/soupiva/)**.

---

## O que vem na caixa

```
pesquisa-de-publico-do-piva/
├── SKILL.md              → o fluxo de trabalho que o Claude segue
├── prompts.md            → os seis prompts de pesquisa, testados em produção
├── assets/
│   └── template.html     → o documento final, já pronto e estilizado
└── README.md             → este arquivo
```

O `template.html` já é o relatório inteiro montado — tema escuro, ícones, abas, tabelas, selos de confiança. O Claude só preenche o conteúdo. **Você não precisa programar nada.**

---

## Instalação (Claude web ou desktop)

1. Baixe o arquivo `pesquisa-de-publico-do-piva.zip` sem descompactar.
2. Antes de tudo, ligue a execução de código: **Configurações → Capacidades → "Execução de código e criação de arquivos"**. Sem isso, skills não funcionam.
3. Vá em **Personalizar → Skills**.
4. Clique em **+ / Adicionar skill** e envie o ZIP.
5. Deixe a skill **ativada** na lista.

Pronto. Skills que você sobe são privadas da sua conta.

### Usando no Claude Code

Descompacte a pasta `pesquisa-de-publico-do-piva/` dentro de `~/.claude/skills/` (para usar em qualquer projeto) ou de `.claude/skills/` na raiz do repositório (para usar só naquele projeto).

---

## Como usar

Abra uma conversa, anexe o documento da sua oferta (`.docx`, `.pdf`, `.md` ou `.txt`) e escreva:

```
/pesquisa-de-publico-do-piva
```

Ou, sem barra, qualquer coisa nesse espírito:

- "faz a pesquisa dessa oferta"
- "monta o arsenal disso"
- "preciso do VoC e da matriz de ângulos desse produto"

O Claude vai ler a oferta, devolver o contexto-base para você confirmar e fazer duas perguntas antes de disparar: **qual recorte de público priorizar** e **se o Trend Report inclui inteligência de concorrência**. Responda e ele roda tudo.

No fim, você recebe o HTML pronto para abrir no navegador.

---

## O que esta skill NÃO faz

Ela termina na pesquisa. **Não escreve anúncios, roteiros, headlines finais nem criativos.** Os hooks que aparecem na Matriz de Ângulos são direção de escrita construída com o vocabulário do público — matéria-prima para o copywriter, não peça pronta para subir.

---

## O princípio que sustenta o resultado

Honestidade epistêmica. A skill **não inventa quote, link, data ou estatística**. Cada citação carrega um selo de confiança (verificável / checar verbatim / adaptar) e cada relatório termina com uma seção de limitações declarando o que não foi possível acessar e o que uma segunda rodada preencheria.

Isso significa que às vezes você vai receber menos material do que esperava. É proposital: pesquisa com menos quotes reais vale mais do que pesquisa cheia de frase bonita que ninguém nunca disse.

---

## Dicas para tirar mais da skill

- **Ofertas melhores geram pesquisas melhores.** Quanto mais completo o documento (promessa, bônus, preço, objeções, FAQ), mais preciso o contexto-base.
- **O recorte muda tudo.** "Pessoas que querem aprender X" rende genérico. "Pessoas que já tentaram X e desistiram" rende ouro. Escolha a dor, não o tema.
- **A fonte-âncora nem sempre é o assunto do produto.** Se você vende um resumo de um livro, talvez a mina não sejam os leitores do livro — sejam as pessoas que vivem o problema que o livro resolve. Diga isso ao Claude na hora de confirmar o contexto.
- **Rode uma segunda rodada quando os caveats apontarem.** Colar 30–50 comentários reais que você mesmo copiou de vídeos do nicho costuma dobrar a qualidade do Léxico.

---

**[@soupiva](https://www.instagram.com/soupiva/)**
