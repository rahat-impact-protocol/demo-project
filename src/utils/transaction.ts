import { Contract, ethers, JsonRpcProvider } from 'ethers';
import { PrismaService } from '../prisma/prisma.service';

export async function createContractInstance(abi: any, contractName: string) {
  const { chainValues, contractAddress } = await getSettings(contractName);
  const provider = new JsonRpcProvider(chainValues?.rpcUrl);
  const contract = new Contract(contractAddress, abi, provider);
  return contract;
}

export async function getSettings(contractName: string) {
  const prisma = new PrismaService();
  const [chainSettings, contractSettings] = await Promise.all([
    prisma.settings.findUnique({
      where: {
        name: 'blockchain',
      },
    }),
    prisma.settings.findUnique({
      where: {
        name: 'contract',
      },
    }),
  ]);
  if (!chainSettings) throw new Error('Blockchain settings not found');
  if (!contractSettings) throw new Error('Contract settings not found');

  const chainValues: any = chainSettings.value;
  const contractValues: any = contractSettings.value;
  const contractAddress = contractValues[contractName]?.address;
  return { chainValues, contractAddress };
}

export async function parseAmount(amount: string, decimals: number) {
  //   const contract = await createContractInstance(abi, 'token');
  //   const decimals = await contract.decimal();
  const formattedAmount = await ethers.parseUnits(amount, decimals);
  return formattedAmount;
}
