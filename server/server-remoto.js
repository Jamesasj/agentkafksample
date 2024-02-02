// server-remoto/server-remoto.js
const express = require("express");
const bodyParser = require("body-parser");
const { Kafka } = require("kafkajs");

const app = express();

const sasl = {
  mechanism: "plain",
  username: process.env.KAFKA_USERNAME,
  password: process.env.KAFKA_PASSWORD,
};
/*
const kafka = new Kafka({
  clientId: "server-remoto",
  brokers: ["kafka:9092"],
  sasl,
});
*/

const kafka = new Kafka({
    clientId: "kafka",
    brokers: ["kafka:9092"],
  });

const producer = kafka.producer();

app.use(bodyParser.json());

app.post("/adicionar-codigo", async (req, res) => {
  const { codigo, parametros } = req.body;
  console.log(
    "############################## passei aqui #############################"
  );
  console.log("codigo=" + codigo);
  console.log(sasl);
  await producer.connect();
  await producer.send({
    topic: "codigo-topico",
    messages: [{ value: JSON.stringify({ codigo, parametros }) }],
  });
  await producer.disconnect();

  res.send("Código adicionado à fila com sucesso.");
});

app.listen(3000, () => {
  console.log("Servidor remoto rodando na porta 3000.");
});
