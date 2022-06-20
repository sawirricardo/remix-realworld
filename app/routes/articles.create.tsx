import { Response } from "@remix-run/node";
import {
	Form,
	useActionData,
	useLoaderData,
	useTransition,
} from "@remix-run/react";
import {
	ActionFunction,
	json,
	LoaderFunction,
	redirect,
} from "@remix-run/server-runtime";
import { z } from "zod";
import { prisma } from "~/db.server";
import { getUser } from "~/session.server";
import Creatable from "react-select/creatable";
import { Tag } from "@prisma/client";
import { useRef } from "react";

type LoaderData = {
	tags: Tag[];
};

export const loader: LoaderFunction = async ({ request }) => {
	const user = await getUser(request);
	if (!user) return redirect("/login");
	const tags = await prisma.tag.findMany();
	return json({
		tags,
	});
};

type ActionData = {
	errors?: {
		title?: string[];
		excerpt?: string[];
		content?: string[];
	};
};

export const action: ActionFunction = async ({ request }) => {
	const user = await getUser(request);
	if (!user) return redirect("/login");

	const formData = await request.formData();

	if (request.method !== "POST") {
		throw new Response("Method not allowed", {
			status: 405,
		});
	}

	const articleData = await z
		.object({
			title: z.string().min(3).max(100),
			excerpt: z.string().min(3).max(100).or(z.string().optional()),
			content: z.string().min(3).max(1000),
		})
		.safeParseAsync({
			title: formData.get("title"),
			excerpt: formData.get("excerpt"),
			content: formData.get("content"),
		});

	if (!articleData.success) {
		return json<ActionData>({
			errors: articleData.error.formErrors.fieldErrors,
		});
	}

	let slug = null;
	do {
		if (slug) {
			slug = `${slug}-2`;
			continue;
		}
		slug = articleData.data.title
			.normalize("NFD") // split an accented letter in the base letter and the acent
			.replace(/[\u0300-\u036f]/g, "") // remove all previously split accents
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9 ]/g, "") // remove all chars not letters, numbers and spaces (to be replaced)
			.replace(/\s+/g, "-");
	} while (
		await prisma.article.findFirst({ where: { slug } }).then((a) => Boolean(a))
	);

	const article = await prisma.article.create({
		data: {
			title: articleData.data.title,
			excerpt: articleData.data.excerpt,
			content: articleData.data.content,
			slug: slug,
			userId: user.id,
		},
	});

	const tags: string[] = JSON.parse(formData.get("tags")?.toString() ?? "[]");
	if (tags.length > 0) {
		await prisma.article.update({
			where: { id: article.id },
			data: {
				tags: {
					connectOrCreate: tags.map((t) => ({
						where: { name: t },
						create: { name: t },
					})),
				},
			},
		});
	}

	return redirect(`/articles/${article.slug}`);
};

export default function CreateArticle() {
	const transition = useTransition();
	const actionData = useActionData() as ActionData;
	console.log(actionData);
	const { tags } = useLoaderData<LoaderData>();
	const tagsRef = useRef<HTMLInputElement>(null);
	return (
		<>
			<div className="editor-page">
				<div className="page container">
					<div className="row">
						<div className="col-md-10 offset-md-1 col-xs-12">
							<Form method="post">
								<fieldset>
									<fieldset className="form-group">
										<input
											type="text"
											className="form-control form-control-lg"
											placeholder="Article Title"
											disabled={transition.state === "submitting"}
											name="title"
											required
										/>
										{actionData?.errors?.title && (
											<div className="error-messages">
												{actionData.errors.title.join(", ")}
											</div>
										)}
									</fieldset>
									<fieldset className="form-group">
										<input
											type="text"
											className="form-control"
											placeholder="What's this article about?"
											disabled={transition.state === "submitting"}
											name="excerpt"
										/>
										{actionData?.errors?.excerpt && (
											<div className="error-messages">
												{actionData.errors.excerpt.join(", ")}
											</div>
										)}
									</fieldset>
									<fieldset className="form-group">
										<textarea
											className="form-control"
											rows={8}
											placeholder="Write your article (in markdown)"
											disabled={transition.state === "submitting"}
											name="content"
											required
										></textarea>
										{actionData?.errors?.content && (
											<div className="error-messages">
												{actionData.errors.content.join(", ")}
											</div>
										)}
									</fieldset>
									<fieldset className="form-group">
										<Creatable
											options={tags.map((tag) => ({
												value: tag.name,
												label: tag.name,
											}))}
											className="form-control"
											placeholder="Enter tags"
											isMulti={true}
											isDisabled={transition.state === "submitting"}
											onChange={(value) => {
												tagsRef.current!.value = JSON.stringify(
													value.map((v) => v.value)
												);
											}}
										/>
										<input type={`hidden`} name={"tags"} ref={tagsRef} />
									</fieldset>
									<button
										className="btn btn-lg pull-xs-right btn-primary"
										disabled={transition.state === "submitting"}
									>
										Publish Article
									</button>
								</fieldset>
							</Form>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
