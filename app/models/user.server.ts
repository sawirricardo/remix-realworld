import type { User } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "~/db.server";

export type { User } from "@prisma/client";

export async function getUserById(id: User["id"]) {
	return prisma.user.findFirst({ where: { id } });
}

export async function getUserByEmail(email: User["email"]) {
	return prisma.user.findUnique({ where: { email } });
}

export async function createUser(
	name: User["name"],
	email: User["email"],
	password: string
) {
	const hashedPassword = await bcrypt.hash(password, 10);

	return prisma.user.create({
		data: {
			name,
			email,
			password: hashedPassword,
		},
	});
}

export async function deleteUserByEmail(email: User["email"]) {
	return prisma.user.delete({ where: { email } });
}

export async function verifyLogin(
	email: User["email"],
	password: User["password"]
) {
	const userWithPassword = await prisma.user.findFirst({
		where: { email },
	});

	if (!userWithPassword || !userWithPassword.password) {
		return null;
	}

	const isValid = await bcrypt.compare(password, userWithPassword.password);

	if (!isValid) {
		return null;
	}

	const { password: _password, ...userWithoutPassword } = userWithPassword;

	return userWithoutPassword;
}

export async function updatePassword(user: User, value: User["password"]) {
	await prisma.user.update({
		where: { id: user.id },
		data: { password: await bcrypt.hash(value, 10) },
	});
}
