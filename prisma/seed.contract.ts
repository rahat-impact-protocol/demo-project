import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	await prisma.settings.upsert({
		where: { name: 'contract' },
		update: {
			value: {
				token: {
					// abi: '',
					address: '0x9b5a4e041ab18a84f154167569806a55bf53439c',
				},
				fundStorageContract: {
					// abi: '',
					address: '0xca602d481dbdcd046200c0b4b394b6d2ca5ff79c',
				},
			},
			dataType: 'OBJECT',
			requiredFields: ['fundStorageContract'],
			isReadOnly: false,
			isPrivate: false,
		},
		create: {
			name: 'contract',
			value: {
				token: {
					// abi: '',
					address: '0x9b5a4e041ab18a84f154167569806a55bf53439c',
				},
				fundStorageContract: {
					// abi: '',
					address: '0xca602d481dbdcd046200c0b4b394b6d2ca5ff79c',
				},
			},
			dataType: 'OBJECT',
			requiredFields: ['token'],
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
