## 1. Banco de Dados — Migration e Schema

- [x] 1.1 Criar arquivo de migration Drizzle para as tabelas `exercises`, `workout_sessions`, `workout_sets`, `cardio_sessions`
- [x] 1.2 Adicionar schema Drizzle em `api/src/db/schema.ts` com as 4 novas tabelas e seus relacionamentos
- [x] 1.3 Executar migration e verificar criação das tabelas no SQLite

## 2. Backend — Rotas de Exercícios

- [x] 2.1 Criar rota `GET /api/exercises` com busca por nome e filtro por grupo muscular (results locais + proxy wger)
- [x] 2.2 Criar rota `POST /api/exercises` para criar exercício manual
- [x] 2.3 Implementar lógica de cache: se exercício do wger já está no banco local, não consultar API novamente
- [x] 2.4 Registrar as novas rotas em `api/src/routes/index.ts`

## 3. Backend — Rotas de Sessões de Treino

- [x] 3.1 Criar rota `GET /api/workouts` com filtro por data e suporte a templates (`?date=` e `?templates=true`)
- [x] 3.2 Criar rota `POST /api/workouts` para criar sessão de força (com sets) ou cardio, calculando kcal_burned
- [x] 3.3 Criar rota `PUT /api/workouts/:id` para editar sessão existente
- [x] 3.4 Criar rota `DELETE /api/workouts/:id` para remover sessão e sets/cardios em cascade
- [x] 3.5 Criar rota `GET /api/workouts/daily` para aggregated data (sessões por dia, volume, kcal) — paralelo ao `/api/nutrition/daily`
- [x] 3.6 Criar rota `POST /api/workouts/:id/log` para instanciar template como sessão (equivalente ao meal logFromTemplate)
- [x] 3.7 Criar rota `GET /api/workouts/progression/:exerciseId` para histórico de carga e 1RM estimado de um exercício

## 4. Frontend — Tipos e API Client

- [x] 4.1 Adicionar tipos TypeScript em `frontend/src/lib/api.ts`: `Exercise`, `WorkoutSession`, `WorkoutSet`, `CardioSession`, `DailyWorkout`, `WorkoutProgression`
- [x] 4.2 Adicionar métodos em `api` client: `workouts.*`, `exercises.*` com todas as rotas do backend

## 5. Frontend — Estrutura da Página

- [x] 5.1 Criar `frontend/src/components/exercicios/sub-sidebar.tsx` com seções: overview, today, templates, exercises, settings
- [x] 5.2 Substituir o placeholder em `frontend/src/app/exercicios/page.tsx` pela estrutura completa (padrão do módulo de alimentação)

## 6. Frontend — Componente: Hoje (Workout Log)

- [x] 6.1 Criar `frontend/src/components/exercicios/workout-log.tsx` listando sessões do dia com expand para ver sets
- [x] 6.2 Criar `frontend/src/components/exercicios/workout-session-card.tsx` mostrando nome, exercícios, volume e kcal
- [x] 6.3 Criar `frontend/src/components/exercicios/new-workout-dialog.tsx` com tabs "Força" e "Cardio"
- [x] 6.4 Implementar tab Força: seleção de exercício via busca, adição de múltiplos sets (reps + carga), RPE opcional
- [x] 6.5 Implementar tab Cardio: seleção de modalidade, duração, distância opcional, intensidade, preview de kcal calculadas
- [x] 6.6 Implementar lógica de cálculo de kcal em tempo real no formulário (cardio: MET; força: volumétrico)

## 7. Frontend — Componente: Catálogo de Exercícios

- [x] 7.1 Criar `frontend/src/components/exercicios/exercise-library.tsx` com busca textual e filtros por grupo muscular
- [x] 7.2 Criar `frontend/src/components/exercicios/exercise-card.tsx` com nome, grupo muscular, equipamento e GIF lazy
- [x] 7.3 Implementar expand do exercise-card para exibir GIF do wger e detalhes
- [x] 7.4 Criar `frontend/src/components/exercicios/exercise-form-dialog.tsx` para criar exercício manual

## 8. Frontend — Componente: Templates

- [x] 8.1 Criar `frontend/src/components/exercicios/workout-templates.tsx` listando templates com nome, exercícios e último uso
- [x] 8.2 Adicionar botão "Treinar" em cada template que pré-preenche o dialog de nova sessão
- [x] 8.3 Implementar sugestão de carga baseada no último uso do template (progressão automática)
- [x] 8.4 Implementar opção "Salvar como template" na sessão confirmada

## 9. Frontend — Componente: Visão Geral (Overview)

- [x] 9.1 Criar `frontend/src/components/exercicios/overview.tsx` com estrutura de KPIs, heatmap e gráficos
- [x] 9.2 Implementar 4 KPI cards: treinos/semana, volume médio, kcal/semana, sequência
- [x] 9.3 Implementar heatmap de consistência (reusar padrão visual do módulo alimentação)
- [x] 9.4 Implementar gráfico de linhas de volume semanal com filtro de período (7/30/90/180 dias)
- [x] 9.5 Implementar painel de progressão por exercício com seleção e gráfico de carga + indicadores de PR
- [x] 9.6 Implementar tabela mensal: sessões, volume, kcal, % aderência à meta semanal

## 10. Frontend — Componente: Configurações

- [x] 10.1 Criar `frontend/src/components/exercicios/settings-section.tsx` com campos: peso corporal (kg) e meta semanal
- [x] 10.2 Implementar persistência via `api.settings.put("workout_settings", {...})`
- [x] 10.3 Implementar botão de reset para valores padrão (bodyWeightKg: null, weeklyGoal: 3)

## 11. Integração e Testes Manuais

- [x] 11.1 Testar fluxo completo: criar exercício manual → registrar sessão de força → ver na lista do dia
- [x] 11.2 Testar fluxo cardio: configurar peso → registrar corrida → verificar kcal calculadas
- [x] 11.3 Testar busca de exercício via wger e cache local (segunda busca não deve chamar API)
- [x] 11.4 Testar template: criar → iniciar treino → salvar sessão → verificar que template não foi alterado
- [x] 11.5 Verificar overview: heatmap após alguns dias de treino, gráfico de volume, progressão de exercício
