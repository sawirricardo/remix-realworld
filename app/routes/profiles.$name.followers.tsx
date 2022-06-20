import { Response } from "@remix-run/node";
import {
	ActionFunction,
	LoaderFunction,
	redirect,
} from "@remix-run/server-runtime";
import { prisma } from "~/db.server";
import { getUser } from "~/session.server";

export const action: ActionFunction = async ({ request, params: { name } }) => {
	const user = await getUser(request);
	if (!user) return redirect(`login?redirectTo=profiles/${name}`);

	if (user.name === name) {
		throw new Response("Cannot follow yourself", {
			status: 403,
		});
	}

	const userFromDb = await prisma.user.findFirst({
		where: { name, followedBy: { some: { id: user.id } } },
	});

	if (userFromDb) {
		await prisma.user.update({
			where: { name },
			data: { followedBy: { disconnect: { id: user.id } } },
		});

		return redirect(request.url);
	}

	await prisma.user.update({
		where: { name },
		data: { followedBy: { connect: { id: user.id } } },
	});

	return redirect(request.url);
};

export const loader: LoaderFunction = () => {
	return redirect("/");
};
