const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { faker } = require("@faker-js/faker");
const { raw } = require("@prisma/client/runtime");

const prisma = new PrismaClient();

async function seed() {
	const email = "test@example.com";

	// cleanup the existing database
	await prisma.user.delete({ where: { email } }).catch(() => {
		// no worries if it doesn't exist yet
	});

	const hashedPassword = await bcrypt.hash("password", 10);

	const user = await prisma.user.create({
		data: {
			name: "Test",
			email,
			password: hashedPassword,
			image: "https://via.placeholder.com/150x150.png?text=T",
		},
	});

	for (const tag of ["test", "test2"]) {
		await prisma.tag.create({
			data: {
				name: tag,
			},
		});
	}

	for (var i = 0; i < 10; i++) {
		let user = await prisma.user.create({
			data: {
				name: faker.name.findName(),
				email: faker.internet.email(),
				password: await bcrypt.hash("password", 10),
				image: "https://via.placeholder.com/150x150.png?text=Test",
				bio: faker.lorem.sentence(),
			},
		});

		for (var j = 0; j < 10; j++) {
			const title = faker.lorem.sentence();
			let slug = null;
			do {
				if (slug) {
					slug = `${slug}-2`;
					continue;
				}
				slug = title
					.normalize("NFD") // split an accented letter in the base letter and the acent
					.replace(/[\u0300-\u036f]/g, "") // remove all previously split accents
					.toLowerCase()
					.trim()
					.replace(/[^a-z0-9 ]/g, "") // remove all chars not letters, numbers and spaces (to be replaced)
					.replace(/\s+/g, "-");
			} while (
				await prisma.article
					.findFirst({ where: { slug } })
					.then((a) => Boolean(a))
			);

			await prisma.article.create({
				data: {
					title: title,
					slug: slug,
					excerpt: faker.lorem.sentence(),
					content: faker.lorem.paragraph(),
					userId: user.id,
					comments: {
						create: [
							{
								content: faker.lorem.paragraph(),
								userId: (await prisma.user.findFirst()).id,
							},
							{
								content: faker.lorem.paragraph(),
								userId: (await prisma.user.findFirst()).id,
							},
						],
					},
				},
			});
		}
	}

	console.log(`Database has been seeded. 🌱`);
}

seed()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
