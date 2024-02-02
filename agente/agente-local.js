// agente-local.js
const { Kafka } = require('kafkajs');
const axios = require('axios');
const { Worker, isMainThread } = require('worker_threads');
const path = require('path');
/*
const kafka = new Kafka({
  clientId: 'agente-local',
  brokers: ['kafka:9092'],
  sasl: {
    mechanism: 'plain',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  },
});
*/
const kafka = new Kafka({
    clientId: "agente-remoto",
    brokers: ["kafka:9092"],
  });

const consumer = kafka.consumer({ groupId: 'agente-group' });
const producerResultados = kafka.producer();

async function iniciarConsumo() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'codigo-topico', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const { codigo, parametros } = JSON.parse(message.value.toString());
        console.log('##########################################################################')
        console.log('codigo = ' + codigo)
        if (isMainThread) {
            // Se for a thread principal, criar um worker para processar o código
            const worker = new Worker(path.join(__dirname, 'worker.js'), { workerData: { codigo, parametros } });
            console.log('2##########################################################################')

        worker.on('message', resultado => {
          // Enviar o resultado para o servidor remoto
          enviarResultado(resultado);
        });
      } else {
        // Se for um worker, executar o código e enviar o resultado para a thread principal
        const resultado = executarCodigoRemoto(codigo, parametros);
        parentPort.postMessage(resultado);
      }
    },
  });
}

function enviarResultado(resultado) {
  producerResultados.connect()
    .then(() => producerResultados.send({
      topic: 'resultados-topico',
      messages: [{ value: JSON.stringify(resultado) }],
    }))
    .then(() => producerResultados.disconnect())
    .catch(error => {
      console.error('Erro ao enviar resultado ao servidor remoto:', error.message);
    });
}

function executarCodigoRemoto(codigo, parametros) {
  const codigoFunction = new Function(...Object.keys(parametros), codigo);
  return codigoFunction(...Object.values(parametros));
}
/*

setInterval(() => {
    const codigo = 'return "Olá do código remoto com parâmetros: " + nome;';
    const parametros = { nome: 'ChatGPT' };
  
    axios.post('http://server-remoto:3000/adicionar-codigo', { codigo, parametros })
      .then(response => {
        console.log(response.data);
      })
      .catch(error => {
        console.error('Erro ao adicionar código remoto:', error.message);
      });
  }, 10000);
*/


iniciarConsumo();
