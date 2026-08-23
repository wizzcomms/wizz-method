---
name: pesquisa-de-publico-do-piva
description: Gera arsenal completo de pesquisa de público para oferta de infoproduto e tráfego pago a partir de uma oferta (.docx/.md/.txt/.pdf). Produz seis relatórios encadeados — VoC, Perfil Psicográfico Schwartz, Níveis de Consciência, Trend Report, Matriz de Ângulos e Léxico — compilados em dashboard HTML navegável por abas. Use quando o usuário enviar uma oferta e pedir pesquisa de público, VoC, voz do cliente, matriz de ângulos, léxico do público, dores de persona ou arsenal de copy para tráfego direto. NÃO use para pesquisa técnica de libs/código (use context7), pesquisa de mercado B2B ampla (use deep-research) nem pesquisa visual de UI (use premium-landing-ui-researcher). Metodologia de @soupiva.
---

# Pesquisa de Público do Piva

Pipeline de pesquisa de marketing direto para infoprodutos e ofertas de tráfego pago, validado em produção por @soupiva. A partir de uma única oferta, gera seis relatórios encadeados e um documento HTML final navegável por abas. Cada relatório alimenta o próximo.

**Esta skill termina na pesquisa.** Ela não escreve anúncios, roteiros, headlines finais nem criativos prontos. Os hooks que aparecem na Matriz de Ângulos são direção estratégica de escrita baseada na linguagem nativa do público.

## O que esta skill entrega

1. **VoC (Voz do Cliente)** — quotes verbatim reais do público, por categoria emocional, + clusters de ângulo.
2. **Perfil Psicográfico Schwartz** — Identity / Problems / Dreams / Obstacles, por tema, com notas de padrão.
3. **Níveis de Consciência + Escada de Desejos** — 3 tabelas (Awareness, "pra eu poder… N1→N2→N3", Diz/Não Diz/Não Consegue Dizer).
4. **Trend Report orgânico** — tendências culturais/virais dos últimos 30 dias que geram ganchos e formatos (+ inteligência de concorrência opcional).
5. **Matriz de Ângulos** — cruzamento persona × trend × formato, ranqueado por zonas de potencial de escala.
6. **Léxico do Público** — compilação exaustiva de expressões nativas mineradas por território emocional, com selo de confiança e nota de uso na copy.
7. **Documento HTML final** — compila os seis relatórios num arquivo estilizado por abas, usando `assets/template.html`.

## Princípio inegociável: honestidade epistêmica

**Nunca invente quotes, links, datas ou dados.** Só reporte linguagem realmente encontrada em fontes públicas indexadas. Marque o nível de confiança de cada quote:

- `[VERIFICÁVEL]` — quote de fonte pública indexada, com link. Pode levantar direto pra copy.
- `[FÓRUM — checar verbatim]` — vem de thread real, mas o texto pode ter sido parafraseado na coleta. Use como direção de linguagem; verifique antes de citar literal.
- `[EN — adaptar]` — quote em outro idioma. Precisa tradução E adaptação cultural antes de virar copy.

Quando uma fonte não puder ser acessada, **declare claramente na seção Caveats** como limitação de ferramenta — nunca preencha com invenção. Entregue menos quotes reais em vez de mais quotes fabricadas.

## Fluxo de trabalho

### Passo 0 — Ler a oferta e extrair o contexto-base

Leia o documento (ou a descrição) da oferta. Destile o **contexto-base**:
- **Produto**: o que é, formato, preço, promessa central, posicionamento.
- **Persona provável**: quem compra, faixa etária, contexto de vida/trabalho, nível de consciência.
- **Problemas que resolve**: as dores explícitas + as implícitas.
- **Fonte-âncora de linguagem**: onde esse público já fala publicamente (comentários de YouTube, reviews 1-3 estrelas, fóruns, redes sociais).
- **Enquadramento moral**: objeção ética central do nicho, se houver (ex.: "isso é atalho?", "isso manipula?").

Confirme o contexto-base com o usuário em 4-6 linhas antes de disparar a pesquisa:
1. O público tem sub-recortes prioritários (ex.: iniciante vs. avançado; CLT vs. autônomo)?
2. Trend Report apenas orgânico ou incluir inteligência de concorrência (preços e dores pós-compra)?

### Passo 1 — Rodar os seis relatórios

Siga a ordem de dependência (prompts completos em `prompts.md`):
1. **VoC (Rel. 1)** e **Trend (Rel. 4)** → mineração web em paralelo ou em série.
2. **Schwartz (Rel. 2)** → síntese do VoC com atenção especial à camada *Identity*.
3. **Consciência (Rel. 3)** → síntese do Schwartz + VoC (Awareness, Escada de Desejos, Diz/Não Diz/Não Consegue Dizer).
4. **Matriz (Rel. 5)** → cruza Schwartz + Consciência + Trend em Zonas 1 a 4.
5. **Léxico (Rel. 6)** → compilação de todas as expressões nativas mineradas.

### Passo 2 — Compilar o documento HTML final

1. Use o layout pré-formatado de `assets/template.html`.
2. Substitua os placeholders `{{...}}` mantendo o `<style>` e a estrutura intactos.
3. Nomenclatura obrigatória do arquivo: `Pesquisa [NOME_CURTO] - @soupiva.html` (salvo em `{output_folder}/pesquisa-piva/` ou diretório do projeto).
4. Mantenha os selos de confiança (`.pill`) e a assinatura `@soupiva`.

### Passo 3 — Entregar e Conectar

Entregue o HTML gerado com um resumo executivo de 3 a 5 pontos-chave para a estratégia da oferta, e ofereça alimentar a skill `wizz-offer-forge` ou os agentes do `traffic-masters` / `copy-squad`.
