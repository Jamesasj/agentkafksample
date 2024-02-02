// worker.js
const { parentPort, workerData } = require('worker_threads');

const { codigo, parametros } = workerData;

function executarCodigoRemoto(codigo, parametros) {
  console.log('3##########################################################################')
  const codigoFunction = new Function(...Object.keys(parametros), codigo);
  return codigoFunction(...Object.values(parametros));
}

const resultado = executarCodigoRemoto(codigo, parametros);

parentPort.postMessage(resultado);
