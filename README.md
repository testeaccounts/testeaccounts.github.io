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

## Firebase

O projeto agora usa:

- `Firebase Auth` para proteger o painel da Alyssa com e-mail e senha
- `Cloud Firestore` para serviços, agenda, bloqueios, horários ocupados, clientes e notificações

### Configuração necessária

1. No Firebase Console, ative `Authentication > Sign-in method > Email/Password`.
2. Crie a usuária da Alyssa em `Authentication > Users`.
3. Crie o banco em `Firestore Database`.
4. Publique as regras de [firestore.rules](/C:/xampp/77/Projetos/AlyssaUnhas/firestore.rules).

### Estrutura principal no Firestore

- `salon/config`
- `services/{serviceId}`
- `blockedPeriods/{blockId}`
- `slotLocks/{date_time}`
- `appointments/{appointmentId}`
- `notifications/{notificationId}`

### Observação de segurança

As regras incluídas já separam leitura pública do catálogo e da disponibilidade da leitura administrativa da agenda completa. Para um cenário de produção mais rígido, o ideal é mover a criação de agendamentos para Cloud Functions e validar conflito de horários também no backend.
