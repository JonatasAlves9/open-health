## Context

O projeto open-health já possui um módulo de alimentação completo com frontend Next.js e backend Hono/Drizzle/SQLite. A página `/exercicios` existe mas está vazia. A arquitetura atual é monorepo com `api/` (Hono + Drizzle + SQLite) e `frontend/` (Next.js). O padrão de design usa CSS variables (`--oh-*`) com um sistema de glassmorphism. O frontend faz proxy de todas as chamadas `/api/*` para o backend via `app/api/[...path]/route.ts`.

## Goals / Non-Goals

**Goals:**
- Módulo completo de treinos com o mesmo nível de qualidade e visual do módulo de alimentação
- Registro de força (exercício, séries, reps, carga) e cardio (duração, distância, MET)
- Catálogo de exercícios local + enriquecimento via wger REST API (GIFs, grupos musculares)
- Cálculo de calorias gastas (MET para cardio; estimativa por volume para força)
- Progressão por exercício: histórico de carga, volume semanal, 1RM estimado (Epley), PRs
- Overview com heatmap, KPIs (frequência, volume, calorias), gráficos — espelho do módulo de alimentação
- Templates de treino para registro rápido

**Non-Goals:**
- App de treino em tempo real com timer/rest counter (fase 1)
- Planos de treino periódizados gerados por IA
- Sincronização com wearables (Apple Watch, Garmin)
- Banco de exercícios offline completo pre-seed — wger é usado on-demand e cached

## Decisions

### D1: wger REST API como fonte de exercícios
**Escolha**: `https://wger.de/api/v2/` — open source, gratuita, sem chave, dados em PT-BR disponíveis, GIFs via `https://wger.de/en/exercise/{id}/view/`.  
**Alternativas consideradas**:
- ExerciseDB (RapidAPI): paga além de quota, GIFs excelentes mas vendor lock-in
- API Ninjas: sem GIFs, dados básicos
- Banco estático local: muito trabalho de manutenção  
**Decisão**: wger chamado server-side (backend proxy), resultados cached na tabela `exercises` local após primeiro fetch. GIF URL gerado a partir do `wger_id`.

### D2: Cálculo de calorias — MET para cardio, estimativa volumétrica para força
**Escolha**: 
- Cardio: `kcal = MET × peso_kg × duração_h`. Tabela estática de MET por modalidade (corrida ~8, caminhada ~3.5, ciclismo ~6, natação ~7, etc.)
- Força: estimativa simplificada `kcal ≈ sets × reps × (carga_kg × 0.0027)` ou constante por set (~5 kcal/set como fallback)  
**Por quê**: Fórmula MET é o padrão acadêmico para cardio. Para força, a variabilidade é alta — uma estimativa razoável é mais útil do que zero.

### D3: Schema do banco — novas tabelas, sem alterar as existentes
**Escolha**: 4 novas tabelas via migration Drizzle:
```
exercises         — catálogo local (id, name, muscle_group, equipment, wger_id, gif_url)
workout_sessions  — sessão de treino (id, name, logged_at, notes, kcal_burned, body_weight_kg)
workout_sets      — sets de força (id, session_id, exercise_id, set_number, reps, weight_kg, rpe)
cardio_sessions   — sessões de cardio (id, session_id, exercise_id, duration_min, distance_km, intensity, kcal_burned)
```
**Por quê**: Isola completamente do módulo de alimentação, sem risco de regressão. Permite query de progressão por `exercise_id` de forma direta.

### D4: Frontend espelha estrutura do módulo de alimentação
**Escolha**: Sub-sidebar com seções: `overview | today | templates | exercises | settings`. Componentes em `src/components/exercicios/`. Page principal em `src/app/exercicios/page.tsx`.  
**Por quê**: Consistência de UX, reuso de padrões de layout, menor curva de aprendizado para o usuário.

### D5: Peso corporal armazenado em settings, não hard-coded
**Escolha**: `api/settings` com chave `workout_settings` (JSON: `{ bodyWeightKg, weeklyGoal }`).  
**Por quê**: Mesmo padrão do `daily_targets` do módulo de alimentação. Sem nova infraestrutura.

## Risks / Trade-offs

- **wger API indisponível ou lenta** → Mitigation: cache local em `exercises`; busca funciona com dados já importados. Fallback: permitir adicionar exercício manual sem wger.
- **GIFs do wger pesados para mobile** → Mitigation: lazy loading, exibir apenas ao expandir o exercício.
- **Cálculo de calorias impreciso para força** → Mitigation: exibir tooltip "estimativa" no UI; é melhor que zero.
- **SQLite concorrência em escrita** → Mitigation: sem mudança — projeto já usa WAL mode, risco igual ao atual.
- **Scope creep no catálogo de exercícios** → Mitigation: wger retorna ~900 exercícios; cached on-demand. Não fazer seed completo na migration.

## Migration Plan

1. Criar migration Drizzle com as 4 novas tabelas
2. Implementar rotas backend `/api/workouts`, `/api/exercises`
3. Implementar página frontend `/exercicios` com todos os componentes
4. Nenhum rollback complexo — tabelas novas não afetam código existente; se removidas, módulo volta ao placeholder

## Open Questions

- Qual unidade padrão para peso nos sets — kg ou lbs? → Usar kg, com opção de conversão nas settings (fase 2)
- Exibir GIFs inline na tela "Hoje" ou apenas no catálogo? → Apenas no catálogo para não pesar a sessão de treino
