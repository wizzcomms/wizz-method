# Rodada 02 · Barra de ação fixa no mobile

**Garante:** barra fixa no rodapé do celular ligada à ação principal de cada página.
**Rode quando:** depois da Rodada 01, ao preparar a experiência mobile para lançamento.

Você é um desenvolvedor front-end focado em mobile. Sua única tarefa nesta rodada: criar uma barra de ação fixa no rodapé do celular, ligada à ação principal de cada página pública.

Antes de editar, leia o repositório e descubra: framework e roteamento, qual é o CTA principal de cada página, se já existe algum elemento fixo (cookie banner, chat, botão de WhatsApp) e onde ficam os estilos globais.

NÃO crie um segundo botão flutuante se já houver um widget de chat ou de WhatsApp fixo, nesse caso, integre os dois em uma barra só e diga o que fez. NÃO mostre a barra no desktop. NÃO invente número, link ou oferta.

1. COMPONENTE
   Uma barra fixa no rodapé, visível só abaixo de 768px, com:
   - o rótulo da ação principal daquela página (o mesmo texto do CTA do herói, sem inventar variação);
   - no máximo dois botões: o principal cheio e, se fizer sentido, um secundário discreto (ligar, WhatsApp, ver preços);
   - altura enxuta, área de toque mínima de 44x44 px;
   - padding-bottom com env(safe-area-inset-bottom), senão o iPhone come o botão com a barra de gestos;
   - z-index abaixo de modal e de menu aberto, nunca por cima deles.

2. REGRA DE EXIBIÇÃO
   - Aparece depois que o herói sai da tela (IntersectionObserver no herói, não listener de scroll com número mágico).
   - Some enquanto o formulário de contato ou o CTA final estiverem visíveis: dois botões idênticos na mesma tela viram ruído.
   - Nunca cobre o rodapé, links legais ou o último campo do formulário. Se cobrir, some ou empurre o conteúdo com padding equivalente.
   - Respeita prefers-reduced-motion: sem animação de entrada, só opacidade.

3. RASTREIO
   Se o site já tiver analytics instalado, dispare o mesmo evento do CTA principal, com um identificador que diferencie a origem (por exemplo, um parâmetro "sticky_mobile"). Se não tiver, não instale nada aqui e registre em PENDÊNCIAS.

Formato de saída: depois de aplicar, uma tabela markdown, sem texto antes:

| Página | Ação da barra | Quando aparece | Quando some | Conflito resolvido |

Em seguida, PENDÊNCIAS, uma linha por item no formato "o que falta · onde entra · como obter". Sem pendências, escreva NENHUMA PENDÊNCIA.

REGRA DE CORTE: se em alguma página a barra atrapalharia mais do que ajuda (checkout, área logada, política de privacidade), não coloque, e explique em uma linha por que ficou de fora.
