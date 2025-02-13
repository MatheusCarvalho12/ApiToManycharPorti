

## **Documentação do Projeto**

Este projeto automatiza o processo de criação e gerenciamento de usuários em uma plataforma chamada **ManyChat**, além de buscar e processar dados relacionados a plantões médicos de uma API externa. O código é dividido em dois arquivos principais: `index.js` e `utils.js`.

### **Visão Geral do Processo**

1. **Processamento de CSV**: O script lê um arquivo CSV contendo informações de usuários e os cria na plataforma ManyChat.
2. **Busca de Plantões**: O script busca dados de plantões médicos de um determinado período e armazena os profissionais de saúde em um arquivo JSON.
3. **Interação com a API ManyChat**: Através de diversas funções, o código interage com a API ManyChat para criar usuários, adicionar tags e definir campos personalizados.

---

### **Estrutura dos Arquivos**

#### **index.js**

Este é o ponto de entrada do processo e contém as funções principais de execução.

- **Dependências**:
  - `fs`: Módulo nativo do Node.js para manipulação de arquivos.
  - `csv-parser`: Biblioteca para ler e processar arquivos CSV.
  - `dotenv`: Carrega variáveis de ambiente.
  - Funções do arquivo `utils.js`.

- **Funções**:
  - **delay(ms)**: Função que cria um atraso de tempo para evitar sobrecarga nas requisições. Utilizada para aguardar entre a criação de usuários.
  - **readCSV(filePath)**: Lê e processa um arquivo CSV, retornando os dados contidos nele.
  - **processCSV(filePath)**: Processa o arquivo CSV. Para cada usuário no arquivo, a função `createUser` é chamada para criá-lo na plataforma ManyChat.
  - **fetchAndSaveMonthlyShifts()**: Função que, quando descomentada, busca e armazena as informações dos plantões médicos do mês em um arquivo JSON.

---

#### **utils.js**

Contém funções auxiliares para lidar com a API ManyChat e o gerenciamento de arquivos.

- **Dependências**:
  - `fs`: Módulo nativo para manipulação de arquivos.
  - `path`: Módulo nativo para manipulação de caminhos de arquivos.
  - `axios`: Biblioteca para realizar requisições HTTP.
  - `dotenv`: Carrega variáveis de ambiente.

- **Funções**:
  - **formatCpf(cpf)**: Formata um número de CPF para o formato `000.000.000-00`.
  - **readJsonFile(filename)**: Lê e retorna os dados de um arquivo JSON.
  - **writeJsonFile(filename, data)**: Escreve dados em um arquivo JSON.
  - **saveCpfNotFound(cpf)**: Salva CPFs de usuários não encontrados em um arquivo JSON.
  - **saveClientId(data)**: Salva os IDs de usuários criados com sucesso em um arquivo JSON.
  - **apiRequest(method, url, data, params)**: Função genérica para realizar requisições HTTP (GET, POST, etc.) para a API ManyChat.
  - **findUserByCpf(data)**: Busca um usuário na API ManyChat utilizando o CPF fornecido e, se encontrado, adiciona uma tag de "Onboarding".
  - **addCompanyTag(subscriberId, companyName)**: Adiciona uma tag a um usuário específico no ManyChat.
  - **setCustomFields(subscriberId, cpf, empresa, crm)**: Configura os campos personalizados de um usuário na plataforma ManyChat, incluindo CPF, empresa e CRM.
  - **fetchAndSaveMonthlyShifts()**: Busca plantões médicos de um período determinado, filtra os profissionais de saúde e os salva em um arquivo JSON.
  - **tagAllProfessionalsFromJson(filename)**: Aplica tags a todos os profissionais de saúde presentes em um arquivo JSON.

---

### **Funcionamento do Código**

1. **Processamento do CSV**:
   - O arquivo `index.js` começa o processo de leitura do arquivo CSV. A função `processCSV(filePath)` é chamada para processar o arquivo de entrada.
   - A função `createUser(user)` é chamada para cada linha do CSV, onde as informações dos usuários são enviadas para a API ManyChat para criação.

2. **Busca de Plantões Médicos**:
   - A função `fetchAndSaveMonthlyShifts()` (quando descomentada) solicita dados de plantões médicos para o mês especificado através da API externa (`API_MEDBOLSO_URL`).
   - O código filtra os profissionais de saúde com base nos hospitais permitidos e os salva em um arquivo JSON chamado `producaomes.json`.

3. **Integração com ManyChat**:
   - Para cada profissional de saúde encontrado ou para cada usuário do CSV, as funções `createUser`, `addCompanyTag`, e `setCustomFields` são chamadas para configurar os dados do usuário na plataforma ManyChat, incluindo a atribuição de tags e campos personalizados.

---

### **Variáveis de Ambiente**

Este projeto depende de variáveis de ambiente para acessar as APIs externas. As variáveis devem estar definidas em um arquivo `.env`, como o exemplo abaixo:

```env
API_MANYCHAT_URL=https://api.manychat.com/v2/
BEARER_TOKEN_MANYCHAT=<seu_token_de_bearer>
API_MEDBOLSO_URL=https://api.medbolso.com.br/
BEARER_TOKEN_MEDBOLSO=<seu_token_de_bearer_medbolso>
```

---

### **Como Rodar o Projeto**

1. Clone o repositório:
   ```bash
   git clone https://github.com/MatheusCarvalho12/ApiToManycharPorti
   cd ApiToManycharPorti
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie um arquivo `.env` na raiz do projeto e defina as variáveis de ambiente mencionadas acima.

4. Para rodar o processo de criação de usuários (descomente a chamada de `processCSV()` no `index.js`):
   ```bash
   node index.js
   ```

5. Para buscar e salvar os plantões médicos (descomente a chamada de `fetchAndSaveMonthlyShifts()` no `index.js`):
   ```bash
   node index.js
   ```

---

### **Considerações Finais**

Este projeto permite a automação da criação e gestão de usuários em uma plataforma de mensagens (ManyChat) com dados provenientes de um arquivo CSV e informações de plantões médicos. O código é modular, o que facilita a manutenção e adição de novas funcionalidades, como integração com outras APIs ou a inclusão de novos filtros para os plantões.

---

