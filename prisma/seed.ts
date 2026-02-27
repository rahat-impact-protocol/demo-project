import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed Registry
  await prisma.registry.upsert({
    where: { id: 'main' },
    update: {},
    create: {
      id: 'main',
      baseUrl: 'https://example.com',
      //update the public key
      publicKey: '0xf0c84735Af5669c809EfD62C9D4e466d331A95b0',
      //need to update the private key
      privateKey: '404b135088bc4046f8ae06c939e3aa2c3er0fdc0d8c9109926fa5cb7184ec08f',
    },
  });

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
