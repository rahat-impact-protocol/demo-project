import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	await prisma.settings.upsert({
		where: { name: 'contract' },
		update: {
			value: {
				fundStorageContract: {
					// abi: '',
					address: '',
				},
			},
			dataType: 'OBJECT',
			requiredFields: ['tokenDisbursement'],
			isReadOnly: false,
			isPrivate: false,
		},
		create: {
			name: 'contract',
			value: {
				token: {
					// abi: '',
					address: '',
				},
			},
			dataType: 'OBJECT',
			requiredFields: ['tokenDisbursement'],
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
