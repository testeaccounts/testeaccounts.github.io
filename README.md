# Alissa Unhas

Sistema de autoatendimento para manicure/unhas com duas experiências no mesmo projeto:

- fluxo da cliente para escolher serviço, data, horário e confirmar agendamento
- painel administrativo para Alissa gerenciar serviços, agenda, bloqueios, clientes e notificações
- interface mobile-first focada em esmaltação tradicional e unhas naturais

## Stack

- React 19 + TypeScript
- Vite
- `date-fns` para datas e horários
- `lucide-react` para ícones
- GitHub Actions para publicar no GitHub Pages

## Funcionalidades entregues

- catálogo padrão com `Pé e mão tradicional`, `Mão tradicional` e `Pé tradicional`
- interface mobile-first com hero, diferenciais, mapa e carrossel de portfólio
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
- `src/features/admin`: painel da Alissa
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

- `Firebase Auth` para proteger o painel da Alissa com e-mail e senha
- `Cloud Firestore` para serviços, agenda, bloqueios, horários ocupados, clientes e notificações

### Configuração necessária

1. No Firebase Console, ative `Authentication > Sign-in method > Email/Password`.
2. Crie a usuária da Alissa em `Authentication > Users`.
3. Crie o banco em `Firestore Database`.
4. Publique as regras de [firestore.rules](/C:/xampp/77/Projetos/AlyssaUnhas/firestore.rules).
5. Faça o primeiro login da Alissa no painel para permitir que a base inicial seja sincronizada no Firestore.

### Estrutura principal no Firestore

- `salon/config`
- `services/{serviceId}`
- `blockedPeriods/{blockId}`
- `slotLocks/{date_time}`
- `appointments/{appointmentId}`
- `notifications/{notificationId}`

### Observação de segurança

As regras incluídas já separam leitura pública do catálogo e da disponibilidade da leitura administrativa da agenda completa. Para um cenário de produção mais rígido, o ideal é mover a criação de agendamentos para Cloud Functions e validar conflito de horários também no backend.

## Catálogo padrão desta versão

- `Pé e mão tradicional` com duração de `2h`
- `Mão tradicional` com duração de `1h`
- `Pé tradicional` com duração de `1h`

Os preços podem ficar em `0` no painel enquanto não forem definidos. Nesse caso, o app mostra `Sob consulta`.
