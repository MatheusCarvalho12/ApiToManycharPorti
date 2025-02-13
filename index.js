const fs = require("fs");
const csv = require("csv-parser");
require("dotenv").config();
const { createUser, fetchAndSaveMonthlyShifts } = require("./utils");

// Função de atraso para requisições
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Função para ler o CSV e retornar os dados
async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const users = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => users.push(row))
      .on("end", () => resolve(users))
      .on("error", (error) => reject(`Erro ao ler o CSV: ${error.message}`));
  });
}

// Função para processar o CSV e criar usuários
async function processCSV(filePath) {
  try {
    const users = await readCSV(filePath);
    console.log(`Total de usuários lidos: ${users.length}`);

    const userPromises = users.map(async (user) => {
      await createUser(user);
      await delay(500);
    });

    await Promise.all(userPromises);
    console.log("Todos os usuários foram processados com sucesso!");
  } catch (error) {
    console.error(`Erro ao processar o CSV: ${error}`);
  }
}

//fetchAndSaveMonthlyShifts();

//processCSV("data.csv");