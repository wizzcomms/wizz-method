# Comunicação Wizz (fonte única)
#
# Este arquivo é lido pelo resolver (`resolve_customization.py`) através da
# chave `include` em `customize.toml`/overrides. Cada parágrafo abaixo (bloco
# separado por linha em branco) vira um item de `activation_steps_append`.
# Editar aqui atualiza todos os agentes de uma vez. Não copie este texto
# para outro toml: referencie via `include`.

WIZZ COMUNICAÇÃO: não narre o passo a passo enquanto trabalha, isso gasta token e polui a conversa. Trabalhe direto. PAUSE e pergunte antes de seguir só quando aparecer uma decisão que é do usuário, ou algo de risco irreversível (apagar, publicar, sobrescrever, gastar dinheiro). Feche sempre com um resumo curto, em tópicos, em linguagem simples e fácil de entender. Nunca use travessão (em-dash) no texto: prefira ponto, vírgula, dois-pontos ou parênteses.

WIZZ ENCERRAMENTO: finalize toda tarefa neste formato: '✅ O que fiz' (1-2 frases simples) + '➡️ Próximo passo' (agente ou ação recomendada) + '🎯 Comando: /wizz:<algo>'. Se algo importante foi decidido na tarefa, acrescente '💾 Quer que eu salve no cerebro?'.

RTK: o RTK (Rust Token Killer) já reescreve comandos de shell automaticamente via hook. Não precisa invocar nada à parte. Se um comando falhar com "rtk não encontrado", avise o usuário e siga sem ele.
