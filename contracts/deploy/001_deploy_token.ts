import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
const fs = require('fs');

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const ArtMobs = await hre.ethers.getContractFactory("ArtMobs");
  const ArtMobsInit = await ArtMobs.deploy();
  await ArtMobsInit.deployed();
  console.log("NftAddress deployed to:", ArtMobsInit.address);

  let config = `
  export const NftAddress = "${ArtMobsInit.address}"
  export const DeployerAddress = "${deployer}"
  `

  let data = JSON.stringify(config)
  fs.writeFileSync('config.js', JSON.parse(data))

};
export default func;
func.tags = ['ArtMobs'];
