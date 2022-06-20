import { Response } from "@remix-run/node";
import {
	ActionFunction,
	LoaderFunction,
	redirect,
} from "@remix-run/server-runtime";
import { prisma } from "~/db.server";
import { getUser } from "~/session.server";

export const action: ActionFunction = async ({ request, params: { slug } }) => {
	const user = await getUser(request);
	if (!user) return redirect(`login?redirectTo=articles/${slug}`);

	await prisma.article
		.findFirst({
			where: { slug, userId: user.id },
		})
		.then((article) => {
			if (article) {
				return new Response("Cannot favorite your own article", {
					status: 403,
				});
			}
		});

	const article = await prisma.article.findFirst({
		where: {
			slug,
			favorites: { some: { id: user.id } },
		},
	});

	if (!article) {
		await prisma.article.update({
			where: { slug },
			data: { favorites: { connect: { id: user.id } } },
		});

		return redirect(request.url);
	}

	await prisma.article.update({
		where: { slug },
		data: { favorites: { disconnect: { id: user.id } } },
	});

	return redirect(request.url);
};

export const loader: LoaderFunction = () => {
	return redirect("/");
};
