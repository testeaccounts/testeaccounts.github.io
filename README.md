# Alyssa Unhas

Sistema de autoatendimento para manicure/unhas com duas experiências no mesmo projeto:

- fluxo da cliente para escolher serviço, data, horário e confirmar agendamento
- painel administrativo para Alyssa gerenciar serviços, agenda, bloqueios, clientes e notificações

## Stack

- React 19 + TypeScript
- Vite
- `date-fns` para datas e horários
- `lucide-react` para ícones
- GitHub Actions para publicar no GitHub Pages

## Funcionalidades entregues

- catálogo de serviços com duração e preço
- disponibilidade baseada em funcionamento semanal, bloqueios e duração do serviço
- prevenção de conflito de horários
- formulário de agendamento com validação de nome, telefone e e-mail
- confirmação visual de agendamento
- painel com agenda do dia, confirmação, cancelamento e remarcação
- cadastro e edição de serviços
- configuração de funcionamento semanal
- bloqueios de períodos ou de dia inteiro
- central de notificações preparada para WhatsApp, e-mail ou notificações internas
- base de clientes derivada dos agendamentos

## Estrutura

- `src/features/booking`: experiência principal da cliente
- `src/features/admin`: painel da Alyssa
- `src/hooks/useSalonStore.ts`: estado, persistência e ações de negócio
- `src/lib/scheduling.ts`: regras de agenda, conflito e disponibilidade
- `src/lib/notifications.ts`: geração e atualização das notificações
- `src/data/seed.ts`: dados iniciais e demo

## Como rodar

```bash
npm install
npm run dev
```

## Validação local

```bash
npm run lint
npm run build
```

## Deploy

O projeto já inclui o workflow `.github/workflows/deploy.yml`. Ao subir a branch `main`, o GitHub Actions faz o build e publica em GitHub Pages.

## Observação importante

Para permitir deploy estático imediato no GitHub Pages, a persistência atual usa `localStorage` com uma camada de store organizada. Isso deixa a UX e as regras de agenda prontas, mas não sincroniza agendamentos entre dispositivos diferentes.

Se a Alyssa for usar em produção com clientes reais acessando de celulares diferentes, o próximo passo é trocar apenas a camada de persistência por um backend compartilhado, como Supabase, Firebase ou API própria, reaproveitando a interface e as regras já implementadas.
