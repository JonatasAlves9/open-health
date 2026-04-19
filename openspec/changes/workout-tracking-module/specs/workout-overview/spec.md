## ADDED Requirements

### Requirement: Exibir KPIs de treino no panorama
O sistema SHALL exibir no painel de visão geral os principais indicadores de desempenho: frequência semanal média, volume total de carga, calorias queimadas e sequência de dias treinando.

#### Scenario: KPIs com dados disponíveis
- **WHEN** o usuário acessa a seção "Visão Geral" do módulo de exercícios
- **THEN** o sistema exibe cards com: treinos/semana, volume médio (kg), kcal média/semana, sequência atual (dias)

#### Scenario: KPIs sem dados históricos
- **WHEN** nenhum treino foi registrado ainda
- **THEN** o sistema exibe os cards com valores zerados e texto incentivando o primeiro registro

#### Scenario: Comparação com período anterior
- **WHEN** há dados suficientes para comparação
- **THEN** cada KPI exibe delta (▲/▼) em relação ao período anterior selecionado

### Requirement: Heatmap de consistência de treino
O sistema SHALL exibir um calendário heatmap anual mostrando os dias treinados, igual ao padrão do módulo de alimentação.

#### Scenario: Dia treinado com alta intensidade
- **WHEN** um dia tem sessão(ões) com kcal_burned alto (acima da média)
- **THEN** o cell do heatmap exibe cor mais intensa (verde escuro)

#### Scenario: Dia com apenas cardio leve
- **WHEN** um dia tem somente sessão de cardio de intensidade leve
- **THEN** o cell exibe cor de intensidade baixa

#### Scenario: Dia sem treino
- **WHEN** nenhuma sessão foi registrada em um dia
- **THEN** o cell exibe cor neutra (background)

#### Scenario: Tooltip ao passar o mouse
- **WHEN** o usuário passa o mouse sobre um cell do heatmap
- **THEN** o sistema exibe tooltip com data, número de sessões e kcal total do dia

### Requirement: Gráfico de volume semanal
O sistema SHALL exibir um gráfico de linhas mostrando o volume total de treino (kg × reps) por semana ao longo do período selecionado.

#### Scenario: Gráfico com filtro de período
- **WHEN** o usuário seleciona um período (7/30/90/180 dias)
- **THEN** o sistema atualiza o gráfico de volume para o período correspondente

#### Scenario: Hover no gráfico de volume
- **WHEN** o usuário passa o mouse sobre um ponto do gráfico
- **THEN** o sistema exibe tooltip com data, volume total e número de sessões

### Requirement: Progressão por exercício
O sistema SHALL permitir visualizar a evolução de carga e volume de um exercício específico ao longo do tempo, incluindo 1RM estimado (fórmula de Epley).

#### Scenario: Selecionar exercício para ver progressão
- **WHEN** o usuário seleciona um exercício no painel de progressão
- **THEN** o sistema exibe gráfico de linha com o peso máximo do exercício por sessão ao longo do tempo

#### Scenario: Exibir 1RM estimado
- **WHEN** o exercício tem sets com reps entre 1 e 12
- **THEN** o sistema calcula e exibe 1RM estimado = carga × (1 + reps/30) (fórmula de Epley)

#### Scenario: Destacar Personal Records
- **WHEN** uma sessão contém o maior peso já registrado para um exercício
- **THEN** o sistema marca o ponto no gráfico com indicador especial (PR badge)

### Requirement: Resumo por mês
O sistema SHALL exibir tabela mensal com: número de sessões, volume total, kcal queimadas e aderência à meta de frequência.

#### Scenario: Tabela mensal com dados
- **WHEN** há sessões registradas em um mês
- **THEN** o sistema exibe linha com: mês, nº sessões, volume (kg), kcal, % aderência à meta semanal

#### Scenario: Linha de mês sem treinos
- **WHEN** um mês não tem nenhuma sessão
- **THEN** o sistema exibe a linha com zeros e aderência 0%
