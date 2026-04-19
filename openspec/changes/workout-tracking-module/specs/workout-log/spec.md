## ADDED Requirements

### Requirement: Registrar sessão de treino de força
O sistema SHALL permitir ao usuário criar uma sessão de treino contendo um ou mais exercícios de força, cada um com séries, repetições, carga (kg) e RPE opcional.

#### Scenario: Criar nova sessão de força
- **WHEN** o usuário clica em "Novo treino" na seção "Hoje"
- **THEN** o sistema abre um dialog/form para registrar a sessão com nome, data e exercícios

#### Scenario: Adicionar exercício a uma sessão
- **WHEN** o usuário busca e seleciona um exercício no formulário de sessão
- **THEN** o sistema adiciona o exercício à sessão com campos para sets, reps e carga

#### Scenario: Adicionar múltiplas séries a um exercício
- **WHEN** o usuário clica em "+ Série" em um exercício da sessão
- **THEN** o sistema adiciona uma nova linha de set com campos de reps e carga

#### Scenario: Remover exercício de uma sessão
- **WHEN** o usuário clica no botão remover de um exercício na sessão
- **THEN** o sistema remove o exercício e todos os seus sets da sessão

#### Scenario: Salvar sessão de força
- **WHEN** o usuário confirma o formulário com pelo menos um exercício e um set
- **THEN** o sistema persiste a sessão, calcula calorias estimadas e exibe na lista do dia

### Requirement: Registrar sessão de cardio
O sistema SHALL permitir registrar atividades cardiovasculares com modalidade, duração, distância opcional e intensidade, calculando calorias via fórmula MET × peso_corporal × tempo.

#### Scenario: Criar sessão de cardio
- **WHEN** o usuário clica em "Novo cardio" ou seleciona tipo "Cardio" no dialog
- **THEN** o sistema exibe campos: modalidade (corrida/caminhada/bike/natação/outro), duração (min), distância (km, opcional), intensidade (leve/moderada/intensa)

#### Scenario: Cálculo automático de calorias de cardio
- **WHEN** o usuário informa duração e o sistema tem o peso corporal configurado
- **THEN** o sistema calcula e exibe calorias estimadas usando MET × peso_kg × (duração_min / 60)

#### Scenario: Salvar sessão de cardio sem peso corporal configurado
- **WHEN** o usuário salva cardio e o peso corporal não está configurado nas settings
- **THEN** o sistema salva a sessão sem calorias e exibe aviso "Configure seu peso nas configurações para calcular calorias"

### Requirement: Visualizar treinos do dia
O sistema SHALL exibir na seção "Hoje" todas as sessões de treino registradas na data selecionada, agrupadas por sessão, com calorias totais.

#### Scenario: Listar sessões do dia atual
- **WHEN** o usuário acessa a seção "Hoje"
- **THEN** o sistema exibe todas as sessões do dia com nome, exercícios/modalidade, volume total e kcal estimadas

#### Scenario: Expandir sessão para ver sets
- **WHEN** o usuário clica em uma sessão na lista
- **THEN** o sistema exibe todos os exercícios com suas séries, reps e cargas

#### Scenario: Editar sessão existente
- **WHEN** o usuário clica em editar em uma sessão
- **THEN** o sistema abre o formulário preenchido com os dados da sessão para modificação

#### Scenario: Remover sessão
- **WHEN** o usuário confirma a remoção de uma sessão
- **THEN** o sistema deleta a sessão e todos os sets/cardios associados e atualiza o totalizador do dia

### Requirement: Cálculo de calorias por sessão de força
O sistema SHALL estimar calorias gastas em treinos de força com base no volume total (sets × reps × carga).

#### Scenario: Calcular calorias de força com carga informada
- **WHEN** uma sessão de força é salva com sets contendo carga > 0
- **THEN** o sistema calcula kcal ≈ Σ(sets × reps × carga_kg × 0.0027) e armazena em `workout_sessions.kcal_burned`

#### Scenario: Calcular calorias de força sem carga (peso corporal)
- **WHEN** sets são registrados com carga = 0 (ex.: flexões)
- **THEN** o sistema usa estimativa fixa de 5 kcal por set como fallback
