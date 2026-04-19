## ADDED Requirements

### Requirement: Configurar peso corporal para cálculo de calorias
O sistema SHALL permitir ao usuário informar seu peso corporal (kg), que é necessário para o cálculo de calorias gastas em cardio via fórmula MET.

#### Scenario: Salvar peso corporal
- **WHEN** o usuário informa o peso e clica em salvar nas configurações
- **THEN** o sistema persiste em `api/settings` com chave `workout_settings.bodyWeightKg` e usa o valor nos cálculos futuros

#### Scenario: Peso não configurado com cardio registrado
- **WHEN** o usuário registra cardio sem peso corporal configurado
- **THEN** o sistema salva a sessão sem calorias e exibe badge "Sem peso configurado" no card da sessão

#### Scenario: Recalcular sessões após configurar peso
- **WHEN** o usuário configura o peso pela primeira vez
- **THEN** o sistema NÃO recalcula sessões históricas (evitar efeitos colaterais inesperados)

### Requirement: Configurar meta de frequência semanal
O sistema SHALL permitir definir quantos treinos por semana o usuário pretende realizar, usado para calcular aderência no overview.

#### Scenario: Definir meta semanal
- **WHEN** o usuário define meta de 3 treinos/semana
- **THEN** o sistema usa esse valor para calcular % aderência no heatmap e na tabela mensal

#### Scenario: Meta padrão
- **WHEN** nenhuma meta foi configurada
- **THEN** o sistema usa 3 treinos/semana como padrão

### Requirement: Resetar configurações de treino
O sistema SHALL oferecer opção de resetar as configurações de treino para os valores padrão.

#### Scenario: Resetar configurações
- **WHEN** o usuário clica em "Resetar padrões" nas configurações de treino
- **THEN** o sistema restaura bodyWeightKg = null e weeklyGoal = 3
