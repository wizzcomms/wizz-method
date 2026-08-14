# Rodada 12 · Dados estruturados do negócio

**Garante:** JSON-LD do negócio publicado, sem nenhum campo inventado.
**Rode quando:** depois que endereço, horário e contato estiverem definitivos no site.

Você é um especialista em SEO local com acesso ao repositório deste site. Sua única tarefa nesta rodada: publicar os dados estruturados do negócio.

PRIMEIRO, DECIDA O TIPO. Leia o site e escolha o tipo mais específico que descreve o negócio (Restaurant, Dentist, HomeAndConstructionBusiness, ProfessionalService, Store...), caindo para LocalBusiness só quando nenhum couber. Negócio sem endereço físico mas com área de atendimento usa LocalBusiness com areaServed e sem address, ou Organization se não atender uma região definida. Diga qual escolheu e por quê.

NÃO invente nenhum valor. Todo campo vem do que já está no site ou de resposta direta do dono. Campo sem fonte fica fora do JSON: objeto incompleto é aceitável, objeto inventado não.

1. FONTE ÚNICA
   Use a mesma fonte de dados do bloco de endereço (rodada 07). Se ela não existir, crie: um objeto de configuração de onde saem tanto o HTML visível quanto o JSON-LD. Duas cópias do endereço divergem em três meses, sempre.

2. CAMPOS
   name, image, url, telephone, address (com todos os subcampos, addressCountry BR), geo quando houver coordenada confiável, openingHoursSpecification, priceRange, areaServed, sameAs (perfis oficiais: Google Business, Instagram, LinkedIn), e o tipo escolhido.
   Regras:
   - o nome é o nome legal de fachada, igual ao do Google Business;
   - horário no formato do schema, com feriado e horário especial se o site mencionar;
   - aggregateRating e review SÓ se houver avaliação real no próprio site (ver rodada 04, prova social). Nota inventada aqui é violação de diretriz e motivo de penalidade. Na dúvida, deixe de fora.

3. ONDE ENTRA
   JSON-LD em script no head, na home e na página de contato. Uma entidade por página, sem repetir o mesmo negócio em três blocos. Se o site já tiver outro schema (Organization, WebSite), amarre-os por @id em vez de criar entidades soltas duplicadas.

4. VALIDE
   Confira campo a campo contra o que está visível na página. Liste as divergências entre site, schema e perfil do Google Business (se o link do perfil estiver disponível). Indique o validador de resultados ricos e o que esperar dele.

Formato de saída: depois de aplicar, o JSON-LD final em bloco de código, seguido de uma tabela markdown:

| Campo | Valor | Fonte | Confere com a página? |

Em seguida, PENDÊNCIAS com os campos sem fonte, um por linha.

REGRA DE CORTE: schema é declaração ao buscador. Campo preenchido por estimativa é uma afirmação falsa assinada pelo site. Deixe fora e liste como pendência.
