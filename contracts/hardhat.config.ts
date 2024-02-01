import { task } from 'hardhat/config'
import { HardhatUserConfig } from 'hardhat/types'

import 'hardhat-deploy'
import '@typechain/hardhat'
import '@nomiclabs/hardhat-web3'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@openzeppelin/hardhat-upgrades'

import { utils } from 'ethers'
// import keccak from 'keccak'

import networks from './hardhat.network'

const config: HardhatUserConfig = {
  networks,

  solidity: {
    compilers: [
      {
        version: '0.8.4',
        settings: {
          optimizer: {
            enabled: true,
            runs: 20,
          },
        },
      },
    ],
  },

  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
    },
    dao: {
      default: 1,
    }
  },

  paths: {
    sources: './src',
  },
  mocha: {
    timeout: 20000000,
    parallel: true,
  },
}

export default config
