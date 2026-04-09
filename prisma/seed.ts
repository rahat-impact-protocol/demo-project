import { PrismaClient } from '@prisma/client';
import { Wallet } from 'ethers';

const prisma = new PrismaClient();

async function main() {
  // Seed Blockchain Settings
  await prisma.settings.upsert({
    where: { name: 'blockchain' },
    update: {},
    create: {
      name: 'blockchain',
      value: {
        network: 'mainnet',
        rpcUrl: 'https://mainnet.infura.io/v3/your-infura-key',
        chainId: 1,
        explorer: 'https://etherscan.io',
      },
      dataType: 'OBJECT',
      requiredFields: ['network', 'rpcUrl', 'chainId', 'explorer'],
      isReadOnly: false,
      isPrivate: false,
    },
  });

  const walletDetails: any = await walletGeneration();
  await prisma.settings.create({
    data: {
      name: 'accoount',
      value: walletDetails,
      dataType: 'OBJECT',
      requiredFields: ['privateKey'],
      isPrivate: true,
      isReadOnly: true,
    },
  });
}

async function walletGeneration() {
  const wallet = await Wallet.createRandom();
  return wallet;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
