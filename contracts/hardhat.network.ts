import 'hardhat-deploy';
import 'hardhat-deploy-ethers';
// import { node_url, accounts } from './utils/network';
import { HardhatUserConfig } from 'hardhat/config'

import fs from 'fs'
// const config: HardhatUserConfig = {
//   solidity: {
//     version: '0.8.4',
//   },
//   networks: {
//     rinkeby: {
//       url: node_url('rinkeby'),
//       accounts: accounts('rinkeby'),
//     },
//   },
//   namedAccounts: {
//     deployer: 0,
//   },
//   paths: {
//     sources: 'src',
//   },
// };
// export default config;

function mnemonic() {
  try {
    return fs.readFileSync(`./mnemonic.txt`).toString().trim()
  } catch (e) {
    console.log('☢️  warning: No mnemonic file created for a deploy account. Try `yarn run generate` and then `yarn run account`.')
  }
  return ''
}

const networks: HardhatUserConfig['networks'] = {
  mainnet: {
    url: 'https://mainnet.infura.io/v3/REDACTED_INFURA_KEY/',
    chainId: 1,
    accounts: {
      mnemonic: mnemonic(),
    },
  },
  testnet: {
    url: 'https://rinkeby.infura.io/v3/REDACTED_INFURA_KEY/',
    chainId: 4,
    gasPrice: 11e9,
    gas: 20e6,
    accounts: {
      mnemonic: mnemonic(),
    },
  },
}

export default networks
