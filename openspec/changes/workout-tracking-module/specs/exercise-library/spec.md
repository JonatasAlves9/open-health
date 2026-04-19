## ADDED Requirements

### Requirement: Buscar exercícios no catálogo
O sistema SHALL permitir busca de exercícios por nome ou grupo muscular, retornando resultados do banco local e buscando na wger API quando necessário.

#### Scenario: Busca com resultados locais
- **WHEN** o usuário digita um termo de busca e existem exercícios locais correspondentes
- **THEN** o sistema exibe os resultados locais imediatamente sem chamar a wger API

#### Scenario: Busca com enriquecimento via wger
- **WHEN** o usuário busca um termo que não está no banco local
- **THEN** o sistema consulta `https://wger.de/api/v2/exercise/?format=json&language=2&name=<termo>` e retorna os resultados

#### Scenario: Cache de exercício do wger
- **WHEN** o usuário seleciona um exercício retornado pela wger API
- **THEN** o sistema armazena o exercício localmente (tabela `exercises`) para buscas futuras sem chamar a API novamente

#### Scenario: wger API indisponível
- **WHEN** a wger API não responde em 3 segundos
- **THEN** o sistema exibe apenas os resultados locais e mostra aviso não-bloqueante "Catálogo online indisponível"

### Requirement: Filtrar exercícios por grupo muscular
O sistema SHALL permitir filtrar o catálogo por grupo muscular (peito, costas, ombros, bíceps, tríceps, pernas, core, glúteos, cardio).

#### Scenario: Filtrar por grupo muscular
- **WHEN** o usuário seleciona um grupo muscular no filtro
- **THEN** o sistema exibe apenas os exercícios daquele grupo no catálogo

#### Scenario: Combinar filtro e busca textual
- **WHEN** o usuário aplica filtro de grupo muscular e digita texto
- **THEN** o sistema aplica ambos os filtros simultaneamente

### Requirement: Visualizar detalhes e GIF do exercício
O sistema SHALL exibir informações detalhadas de um exercício incluindo descrição, músculos trabalhados e GIF animado via wger.

#### Scenario: Exibir GIF do exercício
- **WHEN** o usuário expande um exercício no catálogo
- **THEN** o sistema carrega lazy o GIF de `https://wger.de/en/exercise/{wger_id}/view/` e exibe a animação

#### Scenario: Exercício sem GIF disponível
- **WHEN** o exercício não tem `wger_id` ou o GIF não está disponível
- **THEN** o sistema exibe um ícone placeholder com o grupo muscular

### Requirement: Adicionar exercício manual
O sistema SHALL permitir ao usuário criar exercícios personalizados que não existem no catálogo wger.

#### Scenario: Criar exercício manual
- **WHEN** o usuário clica em "Criar exercício" e preenche nome, grupo muscular e equipamento
- **THEN** o sistema cria o exercício localmente sem `wger_id` e o torna disponível para logging

#### Scenario: Editar exercício manual
- **WHEN** o usuário edita um exercício de source "manual"
- **THEN** o sistema atualiza os dados do exercício

#### Scenario: Impedir edição de exercício wger
- **WHEN** o usuário tenta editar um exercício com `wger_id` preenchido
- **THEN** o sistema exibe apenas modo leitura, não permitindo alteração
