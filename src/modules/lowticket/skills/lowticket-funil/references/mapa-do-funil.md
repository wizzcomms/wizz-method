# Mapa do funil · template de saída

Entregue o mapa completo antes de escrever qualquer copy. Ele é o contrato: se um produto muda depois, a copy toda muda junto.

```
FRONT-END
Nome:
Preço:
Dor:

UPSELL 1
Nome:
Preço:
Dor:
Por que vem agora:
3 resultados:

UPSELL 2
Nome:
Preço:
Dor:
Por que só aparece para quem aceitou o U1:
3 resultados:

DOWNSELL
Nome:
Preço:
Dor:
Por que é um produto diferente do recusado:
3 resultados:

OFERTA FINAL
Nome:
Preço:
Dor:
Por que praticamente todo comprador pode querer:
3 resultados:
```

## A escada de dor

O que muda de um degrau para o outro não é o preço, é a dor:

| Degrau | Tipo de dor |
|---|---|
| Front | a dor principal |
| U1 | a dor complementar, que só aparece depois de resolver a principal |
| U2 | a dor avançada de quem já está aplicando |
| Downsell | a dor imediata e simples, resolvida rápido |
| Oferta final | a dor universal do nicho |

## O fluxo

```
Front → Checkout → U1
                    ├─ aceitou  → U2
                    └─ recusou  → Downsell
                                   ↓
                              Oferta Final → Obrigado
```

Máximo três etapas pagas depois do checkout. Todo comprador chega na oferta final. U2 e downsell nunca aparecem para a mesma pessoa.

## Checagem antes de fechar o mapa

- [ ] Cada degrau resolve o próximo problema real, não um problema inventado para justificar a venda?
- [ ] O downsell é produto diferente, não desconto?
- [ ] O preço do downsell foi calculado sobre o produto recusado, não sobre o front?
- [ ] O preço do front continuou intacto?
- [ ] Os três resultados de cada degrau são resultados, e não conteúdo?
- [ ] A plataforma suporta OTO de um clique? Se não, isso foi dito antes de prometer?
