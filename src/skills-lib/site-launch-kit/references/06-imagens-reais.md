# Rodada 06 · Imagens reais, não stock

**Garante:** nenhuma imagem fingindo ser gente da casa, com o lugar preparado para a foto real.
**Rode quando:** o site tiver seção de equipe, escritório ou depoimento com foto.

Você é o diretor de arte deste site, com acesso ao repositório. Sua única tarefa nesta rodada: tirar do ar toda imagem que finge ser gente da casa, e preparar o lugar da foto real.

NÃO gere imagem de pessoa. NÃO substitua uma foto de banco de imagens por outra foto de banco de imagens. NÃO invente nome, cargo ou biografia.

1. INVENTÁRIO
   Percorra todas as imagens do projeto (pasta de assets, componentes, CMS, URLs externas) e classifique cada uma:
   - REAL: é do negócio, do time, do produto ou do trabalho entregue;
   - GENÉRICA: banco de imagens, ilustração de template, foto de modelo, escritório que não é o escritório;
   - INDEFINIDA: não dá para saber sem perguntar.
   Sinais de genérica: nome de arquivo com id numérico de banco de imagens, aperto de mão corporativo, operador de headset, sala de reunião com pessoas rindo de gráfico, foto perfeita em contexto de negócio pequeno.

2. DECIDA POR IMAGEM
   - Genérica em seção de equipe, escritório ou depoimento: remove.
   - Genérica como fundo abstrato ou textura: pode ficar, se não afirmar nada sobre o negócio. Diga isso na tabela.
   - Indefinida: pergunte antes de mexer.

3. PREPARE O LUGAR DA FOTO REAL
   - Componente de equipe com foto, nome e cargo (nunca só cargo).
   - Proporção fixa com object-fit: cover, para foto de celular vertical não quebrar a grade quando chegar.
   - Tamanho responsivo, carregamento preguiçoso fora da primeira tela e dimensões declaradas, para não pular layout.
   - Texto alternativo descrevendo quem está na foto, não "foto da equipe".
   - Enquanto a foto real não chegar: bloco fora da página com TODO. Um monograma com as iniciais é aceitável como provisório. Stock, não.

4. ENTREGUE O BRIEFING DE FOTO
   Cinco linhas, no tom de mensagem de WhatsApp, dizendo o que fotografar (equipe no local de trabalho, luz natural, sem pose corporativa), quantas fotos, orientação, resolução mínima e o que evitar.

Formato de saída: depois de aplicar, uma tabela markdown, sem texto antes:

| Imagem | Onde aparece | Classificação | Ação | Substituta necessária |

Em seguida, PENDÊNCIAS com as fotos que precisam ser tiradas, e o briefing de foto em bloco de citação.

REGRA DE CORTE: seção de equipe vazia é melhor que seção de equipe falsa. Se a remoção esvaziar uma página inteira, diga isso e proponha o que colocar no lugar com material que já exista.
