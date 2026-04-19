## ADDED Requirements

### Requirement: Criar template de treino
O sistema SHALL permitir salvar um treino como template reutilizável, com nome, exercícios padrão e número sugerido de séries/reps.

#### Scenario: Salvar treino atual como template
- **WHEN** o usuário clica em "Salvar como template" em uma sessão existente
- **THEN** o sistema cria um template com os mesmos exercícios, sets e cargas da sessão

#### Scenario: Criar template do zero
- **WHEN** o usuário clica em "Novo template" na seção de templates
- **THEN** o sistema abre formulário para definir nome e adicionar exercícios com sets/reps sugeridos

#### Scenario: Nomear template
- **WHEN** o usuário salva um template
- **THEN** o sistema exige um nome único (ex.: "Treino A — Peito e Tríceps")

### Requirement: Usar template para registrar treino
O sistema SHALL permitir iniciar uma sessão de treino a partir de um template, copiando a estrutura e permitindo ajustes antes de salvar.

#### Scenario: Iniciar treino a partir de template
- **WHEN** o usuário clica em "Treinar" em um template
- **THEN** o sistema cria uma nova sessão de treino pré-preenchida com os exercícios e sets do template, com data = hoje

#### Scenario: Ajustar carga antes de salvar
- **WHEN** o usuário inicia treino de um template
- **THEN** o sistema sugere as cargas do último treino realizado com esse template (progressão automática)

#### Scenario: Salvar treino derivado de template
- **WHEN** o usuário confirma a sessão iniciada de um template
- **THEN** o sistema salva como sessão normal (não altera o template)

### Requirement: Listar e gerenciar templates
O sistema SHALL exibir todos os templates com informações de uso e permitir edição e remoção.

#### Scenario: Listar templates
- **WHEN** o usuário acessa a seção "Templates"
- **THEN** o sistema exibe cards com: nome do template, número de exercícios, última vez utilizado

#### Scenario: Editar template existente
- **WHEN** o usuário clica em editar em um template
- **THEN** o sistema abre formulário com os dados do template para modificação

#### Scenario: Remover template
- **WHEN** o usuário confirma remoção de um template
- **THEN** o sistema deleta o template sem afetar sessões já registradas derivadas dele
