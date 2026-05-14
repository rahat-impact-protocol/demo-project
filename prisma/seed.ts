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
        network: 'BaseSepolia',
        rpcUrl:
          'https://base-sepolia.g.alchemy.com/v2/yCToD_5zX3QBjftdawuUm5OTlAD6idH7',
        chainId: 84532,
        explorer: 'https://sepolia.basescan.org/',
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

walletGeneration()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
