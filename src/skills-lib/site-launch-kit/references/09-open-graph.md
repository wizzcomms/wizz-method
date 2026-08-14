# Rodada 09 · Prévia de link (Open Graph)

**Garante:** o link rende prévia decente em qualquer lugar onde for colado.
**Rode quando:** o site tiver domínio de produção definido.

Você é um desenvolvedor front-end responsável pela primeira impressão deste site fora dele. Sua única tarefa nesta rodada: fazer o link render uma prévia decente em qualquer lugar onde for colado.

Antes de editar, detecte: framework, onde os metadados são definidos, se existe domínio de produção configurado em algum lugar (variável de ambiente, config, sitemap) e se já há alguma imagem de marca no projeto.

NÃO invente domínio. Sem domínio de produção definido, use a variável de ambiente correspondente e registre em PENDÊNCIAS.

1. TAGS, EM TODA ROTA PÚBLICA
   og:title, og:description, og:url (absoluta), og:type, og:site_name, og:locale (pt_BR), og:image, og:image:width, og:image:height, og:image:alt, twitter:card=summary_large_image, twitter:title, twitter:description, twitter:image.
   Regras que decidem se funciona:
   - toda URL absoluta, com protocolo e domínio. Caminho relativo é a causa número um de prévia vazia no WhatsApp;
   - imagem em 1200x630, JPG ou PNG, abaixo de 1 MB (o WhatsApp corta acima disso; alguns clientes só carregam abaixo de 300 KB);
   - sem WebP e sem SVG como og:image: nem toda plataforma lê;
   - og:title pode diferir do title da página; aqui ele é chamada, não verbete.

2. A IMAGEM
   Se o framework suportar geração dinâmica de imagem de prévia, gere por rota, com o título da página, o nome da marca e o logotipo existente. Se não suportar, crie uma imagem estática por área do site (home, serviços, blog) com o logotipo e uma frase curta. Texto grande e centralizado, com margem de segurança: o WhatsApp corta as bordas em alguns formatos de conversa.

3. FAVICON E ÍCONES
   De passagem, confira favicon, apple-touch-icon e manifest. Ícone do framework padrão ainda no ar é o mesmo problema, no lugar mais visível.

4. VALIDE
   Liste as URLs de validação e o que conferir em cada uma (validador do Facebook, do LinkedIn, do X, e o teste real: colar o link em uma conversa consigo mesmo no WhatsApp). Explique como forçar a limpeza do cache de prévia depois de corrigir. As plataformas guardam a versão antiga por dias.

Formato de saída: depois de aplicar, uma tabela markdown, sem texto antes:

| Rota | og:title | Imagem usada | Dimensão · peso | Absoluta? |

Em seguida, PENDÊNCIAS e a lista de validadores.

REGRA DE CORTE: prévia que você não testou colando o link em algum lugar não está pronta. Se não der para testar agora, diga explicitamente o que ficou por validar.
