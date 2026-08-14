# Rodada 14 · Privacidade e termos (LGPD)

**Garante:** política e termos que descrevem o que ESTE site faz, gerados do inventário técnico.
**Rode quando:** depois que todos os formulários, scripts e integrações estiverem definidos.

Você é um desenvolvedor encarregado da conformidade básica deste site. Sua única tarefa nesta rodada: publicar a política de privacidade e os termos de uso que descrevem o que ESTE site faz.

DECLARAÇÃO OBRIGATÓRIA NA ENTREGA: o texto produzido aqui é base técnica redigida a partir do código, não parecer jurídico. Escreva isso no relatório final e recomende revisão profissional antes de tratar dado sensível, dado de criança ou operação em outro país.

NÃO copie política genérica. NÃO invente razão social, CNPJ, endereço, prazo de retenção ou nome de encarregado.

1. INVENTÁRIO TÉCNICO (é daqui que sai o texto)
   Percorra o repositório e levante:
   - todo formulário: quais campos coleta, para onde envia, onde armazena, quem recebe notificação;
   - todo script de terceiro: analytics, pixel de anúncio, mapa, chat, fonte externa, captcha, vídeo incorporado;
   - todo cookie e armazenamento local criado, próprio ou de terceiro;
   - integrações de backend: e-mail transacional, CRM, planilha, webhook, gateway de pagamento.
   Essa lista é o esqueleto da política. Serviço que você não encontrar no código não entra no texto.

2. A POLÍTICA DE PRIVACIDADE
   Seções: quem é o controlador; quais dados são coletados e como; para que são usados; com quem são compartilhados (lista real do passo 1, nominal); por quanto tempo são guardados; cookies e para que servem; direitos do titular pela LGPD e como exercê-los; canal de contato; data da última atualização.
   Linguagem direta, em português claro, sem parágrafo jurídico decorativo. Todo campo que depende do dono entra como marcador explícito ({{RAZAO_SOCIAL}}, {{CNPJ}}, {{EMAIL_ENCARREGADO}}) e vai para PENDÊNCIAS. Nunca preencha por estimativa.

3. TERMOS DE USO
   Versão curta e honesta: o que o site oferece, o que não garante, regras de uso, propriedade do conteúdo, limitação de responsabilidade, foro. Mesma regra de marcadores.

4. AS LIGAÇÕES
   - Links no rodapé de TODAS as páginas.
   - Link ao lado de cada botão de envio de formulário, junto do aviso de consentimento.
   - Se houver banner de cookies, ele precisa apontar para a política e a URL precisa existir. Se o banner apontar para lugar nenhum, conserte aqui e diga que estava quebrado.
   - Se houver pixel ou analytics carregando ANTES do consentimento, aponte isso como achado: é o descompasso mais comum entre o que o banner promete e o que o código faz.

Formato de saída: depois de aplicar, o inventário do passo 1 em tabela markdown:

| Dado/Serviço | Onde é coletado | Para onde vai | Consta na política? |

Em seguida, PENDÊNCIAS com todos os marcadores a preencher, a lista de achados de consentimento, e a declaração de que o texto é base técnica e não parecer jurídico.

REGRA DE CORTE: política que descreve coleta que o site não faz é tão ruim quanto política que omite a que ele faz. O texto descreve o inventário, nada além dele.
