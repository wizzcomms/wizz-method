# Área 06 · Legal / LGPD

Checa exposição legal básica antes do lançamento. Não é parecer jurídico (isso exige advogado real): é uma varredura de ausências óbvias que qualquer projeto brasileiro coletando dado de usuário precisa cobrir.

## Checagens objetivas

1. **Política de privacidade existe e está acessível.** Ausência total, num produto que coleta dado pessoal (cadastro, formulário, cookie de analytics), é 🔴. Aponte `site-launch-kit` (rodada 14) quando a superfície é site.
2. **Política de privacidade condiz com o que o produto faz de verdade.** Documento genérico copiado que não reflete o app real (ex.: menciona dado que não é coletado, ou não menciona um que é) é 🔴: política incorreta é pior que ausente, porque cria compromisso legal falso. Leia o conteúdo, não só confirme que o arquivo existe.
3. **Termos de uso presentes quando há transação ou conta de usuário.** Ausência é 🟠.
4. **Consentimento de cookies/tracking implementado quando há cookie não essencial.** Analytics/pixel disparando sem qualquer aviso de cookies é 🟠.
5. **Canal pra exercício de direito do titular (LGPD).** Sem nenhum e-mail/formulário de contato pra solicitar exclusão/correção de dado é 🟡; se o volume de dado sensível é alto (saúde, financeiro, menor de idade), sobe pra 🟠.
6. **Base legal e finalidade descritas para dado sensível.** Coleta de dado de categoria sensível (saúde, biometria, dado de criança) sem tratamento específico na política é 🔴: aqui o risco regulatório é maior, não deixe passar como 🟡 por padrão.
7. **Regra setorial extra quando aplicável.** Setores regulados (saúde, financeiro, jurídico) podem exigir aviso/registro além da LGPD genérica (ex.: aviso de "não substitui consulta médica"). Se o `project-context.md` ou o conteúdo do site indicar o setor, verifique o mínimo esperado; se não souber o setor, não assuma: marque PENDÊNCIA perguntando o setor antes de avaliar este item.

## Regra de corte

Não copie um checklist genérico de LGPD sem ler o produto real. O achado tem que citar o que o PRODUTO faz (que dado coleta, de quem, pra quê) confrontado com o que o documento legal diz. Sem essa leitura cruzada, marque PENDÊNCIA DE VERIFICAÇÃO em vez de 🟢.

## Formato de saída

```
| # | Item | Onde (arquivo/rota) | O que falta ou está errado | Severidade | Executor da correção |
```

Sem achado que passe na régua: responda só `NENHUM ACHADO NESTA ÁREA`.
