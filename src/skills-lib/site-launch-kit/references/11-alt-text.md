# Rodada 11 · Texto alternativo correto

**Garante:** cada imagem com o alt certo pela classificação.
**Rode quando:** antes do lançamento, depois que as imagens finais do site estiverem no lugar.

Você é um especialista em acessibilidade com acesso ao repositório deste site. Sua única tarefa nesta rodada: dar a cada imagem o texto alternativo correto.

Antes de escrever, olhe as imagens de fato (abra os arquivos) e leia o contexto em que cada uma aparece. Alt escrito a partir do nome do arquivo é o mesmo problema com outra roupa.

NÃO troque, corte ou gere imagens. NÃO escreva "imagem de" nem "foto de" no começo do alt: o leitor de tela já anuncia que é imagem.

1. INVENTÁRIO E CLASSIFICAÇÃO
   Liste toda imagem do projeto (tags img, componentes de imagem, imagem de fundo com conteúdo, SVG inline, ícones) e classifique:
   - INFORMATIVA: acrescenta conteúdo;
   - DECORATIVA: enfeite, textura, divisor;
   - FUNCIONAL: dentro de link ou botão;
   - COM TEXTO: tem palavras dentro da imagem;
   - COMPLEXA: gráfico, tabela, infográfico.

2. ESCREVA POR CLASSIFICAÇÃO
   - INFORMATIVA: o que se vê e por que importa ali, em até 125 caracteres, sem repetir a legenda que já está no HTML.
   - DECORATIVA: alt="" (vazio, presente). Atributo ausente faz o leitor ler o caminho do arquivo; alt vazio faz ele pular. São coisas diferentes.
   - FUNCIONAL: descreve a AÇÃO ou o destino ("Ir para o WhatsApp"), não a figura ("logotipo do WhatsApp").
   - COM TEXTO: transcreva o texto embutido, na íntegra.
   - COMPLEXA: alt curto identificando o gráfico + descrição longa próxima, em texto de verdade na página.
   Logotipo do próprio site no cabeçalho, quando é link para a home: "Página inicial · [nome da marca]".

3. DE PASSAGEM, ANOTE (sem corrigir agora)
   Imagem sem width e height declarados, imagem acima de 300 KB, formato antigo onde caberia WebP, e imagem de primeira tela com carregamento preguiçoso (que atrasa o conteúdo principal em vez de acelerar).

4. CONFIRA
   Nenhuma tag de imagem pode ficar sem atributo alt. Rode uma busca no repositório para provar isso e mostre o comando usado.

Formato de saída: depois de aplicar, uma tabela markdown, sem texto antes:

| Arquivo/Componente | Onde aparece | Classificação | Alt agora |

Em seguida, a seção OTIMIZAÇÃO PENDENTE com os problemas de carregamento anotados no passo 3, e PENDÊNCIAS com as imagens que você não conseguiu interpretar sem contexto do dono.

REGRA DE CORTE: alt que descreve errado é pior que alt vazio, porque mente para quem não pode conferir. Sem entender a imagem, pergunte.
