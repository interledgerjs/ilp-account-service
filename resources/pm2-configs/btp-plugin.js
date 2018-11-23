const { resolve } = require('path')

// const basicConnector = {
//   script: resolve(__dirname, '../../node_modules/index.js'),
//   env: {
//     DEBUG: 'connector*,ilp*',
//     CONNECTOR_STORE: 'memdown',
//     CONNECTOR_BACKEND: 'one-to-one'
//   }
// }

const basicPlugin = {
  plugin: 'ilp-plugin-btp',
  assetCode: 'USD',
  assetScale: 9
}

const services = []

services.push({
  script: resolve(__dirname, '../../build/index.js'),
  name: 'u1',
  env: {
    CONNECTOR_URL: 'grpc://localhost:5550',
    ACCOUNT_ID: 'u1',
    ACCOUNT_INFO: JSON.stringify({
      ...basicPlugin,
      relation: 'peer',
      options: {
        listener: {
          port: 10101,
          secret: 'u1'
        }
      }
    })
  }
})

module.exports = services
