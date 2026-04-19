## Why

O módulo de exercícios está vazio ("Em breve"). O usuário precisa registrar treinos de força e cardio, acompanhar progressão de carga, calcular calorias gastas e ter uma visão histórica — espelhando a mesma qualidade e visual do módulo de alimentação já existente.

## What Changes

- Novo sub-módulo completo em `/exercicios` substituindo o placeholder atual
- Banco de exercícios local (força + cardio) alimentado via API externa (wger REST API — open source, gratuita, sem chave)
- Registro de treinos de força: exercício, séries, repetições, carga (kg), tempo de descanso, notas
- Registro de cardio: modalidade, duração, distância opcional, intensidade, calorias estimadas via MET
- Cálculo automático de calorias gastas por sessão (fórmula MET × peso × tempo)
- Histórico e progressão por exercício (volume por semana, 1RM estimado, PRs)
- Visão geral com KPIs, heatmap de consistência, gráficos de volume e carga ao longo do tempo
- Configurações: peso corporal (necessário para cálculo MET), metas de frequência semanal
- Templates de treino (A/B, push/pull/legs, etc.) para log rápido

## Capabilities

### New Capabilities

- `workout-log`: Registro diário de sessões de treino (força e cardio) com séries, repetições, carga, duração e calorias calculadas
- `exercise-library`: Catálogo de exercícios com busca, filtro por grupo muscular, GIFs ilustrativos via wger API
- `workout-overview`: Painel com KPIs, heatmap de consistência, gráfico de volume/carga e progressão por exercício
- `workout-templates`: Templates de treino reutilizáveis (como meal templates no módulo de alimentação)
- `workout-settings`: Configurações de peso corporal e metas de frequência semanal

### Modified Capabilities

*(nenhuma — módulo novo)*

## Impact

- **Frontend**: nova página `/exercicios` com sub-sidebar similar ao módulo de alimentação; novos componentes em `src/components/exercicios/`
- **Backend API**: novas rotas REST em `/api/workouts`, `/api/exercises`, `/api/workouts/daily` (paralelo ao `/api/nutrition/daily`)
- **Banco de dados**: novas tabelas Drizzle: `exercises`, `workout_sessions`, `workout_sets`, `cardio_sessions`
- **API externa**: wger REST API (`https://wger.de/api/v2/`) para catálogo de exercícios e GIFs — consumida server-side ou cached localmente; sem necessidade de chave de API
- **Cálculo MET**: tabela estática de valores MET por modalidade de cardio; cálculo de força via estimativa de calorias por volume de treino
- **Sem breaking changes** em código existente
