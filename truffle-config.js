require('dotenv').config()

const HDWalletProvider = require("@truffle/hdwallet-provider");

const privateKey = process.env.PRIVATE_KEY

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 9545,
      network_id: "*"
    },
    test: {
      host: "127.0.0.1",
      port: 9545,
      network_id: "*"
    },
    rinkeby: {
      provider: function () {
        return new HDWalletProvider(privateKey, "https://rinkeby.infura.io/v3/a9b2705f45174588a944999649ad87b1");
      },
      network_id: 4
    } 
  }
};
