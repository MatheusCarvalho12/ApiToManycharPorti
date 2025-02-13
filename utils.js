const fs = require("fs");
const path = require("path");
const axios = require("axios");
require("dotenv").config();

// Função para formatar CPF no padrão 000.000.000-00
function formatCpf(cpf) {
  if (typeof cpf === "string" && cpf.length === 11 && /^\d+$/.test(cpf)) {
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }
  return cpf;
}

// Função para ler um arquivo JSON
function readJsonFile(filename) {
  try {
    return JSON.parse(fs.readFileSync(filename, "utf8"));
  } catch (error) {
    console.error(`Erro ao ler o arquivo ${filename}:`, error.message);
    return [];
  }
}

// Função para escrever dados em um arquivo JSON
function writeJsonFile(filename, data) {
  try {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error(`Erro ao escrever no arquivo ${filename}:`, error.message);
  }
}

// Função para salvar CPFs não encontrados
function saveCpfNotFound(cpf) {
  const filePath = path.join(__dirname, "cpfs_nao_encontrados.json");
  const cpfsNaoEncontrados = readJsonFile(filePath);
  cpfsNaoEncontrados.push(cpf);
  writeJsonFile(filePath, cpfsNaoEncontrados);
}

// Função para salvar IDs de clientes
function saveClientId(data) {
  const filePath = "created_users.json";
  const existingData = readJsonFile(filePath);
  existingData.push(data);
  writeJsonFile(filePath, existingData);
}

// Função genérica para requisições API
async function apiRequest(method, url, data = {}, params = {}) {
  try {
    const response = await axios({
      method,
      url: `${process.env.API_MANYCHAT_URL}${url}`,
      headers: {
        Authorization: `Bearer ${process.env.BEARER_TOKEN_MANYCHAT}`,
        "Content-Type": "application/json",
      },
      data,
      params,
    });
    return response.data;
  } catch (error) {
    console.error(`Erro na requisição para ${url}:`, error.message);
    throw error; // Propaga o erro para o chamador tratar
  }
}

// Função para buscar usuário pelo CPF na API ManyChat
async function findUserByCpf(data) {
  try {
    const cpf = data.profissionalPlantaoCpf;
    const response = await apiRequest(
      "get",
      "fb/subscriber/findByCustomField",
      {},
      { field_id: 11439006, field_value: cpf }
    );

    if (response.status === "success" && response.data.length > 0) {
      const userId = response.data[0].id;
      await addCompanyTag(userId, "Onboarding");
    } else {
      console.log("Usuário não encontrado para o CPF:", cpf);
      saveCpfNotFound(cpf);
    }
  } catch (error) {
    console.error("Erro ao buscar usuário pelo CPF:", error.message);
  }
}

// Função para adicionar tag ao usuário no ManyChat
async function addCompanyTag(subscriberId, companyName) {
  try {
    await apiRequest("post", "fb/subscriber/addTagByName", {
      subscriber_id: subscriberId,
      tag_name: companyName,
    });
  } catch (error) {
    console.error(
      `Erro ao adicionar tag para o usuário ID ${subscriberId}:`,
      error.message
    );
  }
}

// Função para configurar os custom fields de um usuário no ManyChat
async function setCustomFields(subscriberId, cpf, empresa, crm) {
  try {
    const fields = [
      { field_id: 11439006, field_value: cpf },
      { field_id: 11888545, field_value: empresa },
    ];

    if (crm) {
      fields.push({ field_id: 12023729, field_value: crm });
    }

    await apiRequest("post", "fb/subscriber/setCustomFields", {
      subscriber_id: subscriberId,
      fields,
    });
  } catch (error) {
    console.error(
      `Erro ao configurar custom fields para o usuário ID ${subscriberId}:`,
      error.message
    );
  }
}

// Função para buscar e salvar informações de plantões do mês
async function fetchAndSaveMonthlyShifts() {
  try {
    const response = await axios.post(
      process.env.API_MEDBOLSO_URL,
      {
        inicio: "2025-01-01",
        fim: "2025-01-31",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.BEARER_TOKEN_MEDBOLSO}`,
          "Content-Type": "application/json",
        },
      }
    );

    const PMC = ["HOSPITAL MUNICIPAL DE CASTANHAL DRA. MARIA LAISE"];

    const PMA = [
      "U/E ÁGUAS LINDAS",
      "PAAR",
      "SAMU",
      "U/E JADERLÂNDIA",
      "UPA CIDADE NOVA",
      "UPA DISTRITO",
      "UPA ICUÍ",
      "UPA MARIGHELLA",
      "PRONTO SOCORRO MUNICIPAL DE ANANINDEUA",
    ];

    const PMB = [
      "UPA DAICO- ICOARACÍ",
      "UNIDADE MUNICIPAL DE SAUDE DO TAPANÃ",
      "UMS CARANANDUBA",
      "UNIDADE MUNICIPAL DE SAÚDE DO JURUNAS",
      "UMS BAIA DO SOL",
      "PRONTO SOCORRO GUAMÁ",
      "UNIDADE MUNICIPAL DE SAÚDE DO BENGUI",
    ];

    const hospitaisPermitidos = [
      "U/E ÁGUAS LINDAS",
      "PAAR",
      "SAMU",
      "U/E JADERLÂNDIA",
      "UPA CIDADE NOVA",
      "UPA DISTRITO",
      "UPA ICUÍ",
      "UPA MARIGHELLA",
      "PRONTO SOCORRO MUNICIPAL DE ANANINDEUA",
      "HOSPITAL MUNICIPAL DE CASTANHAL DRA. MARIA LAISE",
    ];

    const shifts = response.data.plantoes;
    const uniqueProfessionals = [];

    shifts.forEach((shift) => {
      const { profissionalPlantaoNome, profissionalPlantaoCpf, hospitalNome } =
        shift;
      const formattedCpf = formatCpf(profissionalPlantaoCpf);

      if (hospitaisPermitidos.includes(hospitalNome)) {
        const isDuplicate = uniqueProfessionals.some(
          (prof) => prof.profissionalPlantaoCpf === formattedCpf
        );

        if (!isDuplicate) {
          uniqueProfessionals.push({
            profissionalPlantaoNome,
            profissionalPlantaoCpf: formattedCpf,
          });
        }
      }
    });

    writeJsonFile("producaomes.json", uniqueProfessionals);
    console.log("Arquivo producaomes.json criado com sucesso!");

    await tagAllProfessionalsFromJson("producaomes.json");
  } catch (error) {
    console.error(
      "Erro ao buscar informações de plantões do mês:",
      error.message
    );
  }
}

// Função para aplicar tag a todos os profissionais de um JSON
async function tagAllProfessionalsFromJson(filename) {
  try {
    const professionals = readJsonFile(filename);

    const tagPromises = professionals.map((professional) =>
      findUserByCpf(professional)
    );
    await Promise.all(tagPromises);
  } catch (error) {
    console.error("Erro ao ler ou processar o JSON:", error.message);
  }
}

// Função para criar usuário na API ManyChat
async function createUser(data) {
  try {
    const response = await apiRequest(
      "post",
      "fb/subscriber/createSubscriber",
      {
        first_name: data["Nome"],
        phone: data["Telefone"],
        whatsapp_phone: `55${data["Telefone"]}`,
        email: data["Email"],
        has_opt_in_sms: true,
        has_opt_in_email: true,
        consent_phrase: "ok",
      }
    );

    console.log(`Usuário ${data["Nome"]} criado com sucesso!`);
    saveClientId(response.data.data);

    await addCompanyTag(response.data.data.id, data["Empresa"]);
  } catch (error) {
    console.error(`Erro ao criar o usuário ${data["Nome"]}:`, error.message);
  }
}

module.exports = {
  saveClientId,
  addCompanyTag,
  setCustomFields,
  createUser,
  fetchAndSaveMonthlyShifts,
};
