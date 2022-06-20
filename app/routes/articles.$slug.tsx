import { Article, Comment, Tag, User } from "@prisma/client";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import {
	ActionFunction,
	json,
	LoaderFunction,
	redirect,
} from "@remix-run/server-runtime";
import { prisma } from "~/db.server";
import { marked } from "marked";
import { useOptionalUser } from "~/utils";
import CommentCard from "~/components/comment-card";
import { getUser } from "~/session.server";
import { z } from "zod";
import { Response } from "@remix-run/node";

type LoaderData = {
	article: Article & {
		user: User & {
			followedBy: User[];
		};
		favorites: User[];
		tags: Tag[];
		comments: (Comment & {
			user: User;
		})[];
	};
};

export const loader: LoaderFunction = async ({ request, params: { slug } }) => {
	const article = await prisma.article.findUnique({
		where: { slug },
		include: {
			user: {
				include: {
					followedBy: true,
				},
			},
			favorites: true,
			tags: true,
			comments: {
				include: {
					user: true,
				},
			},
		},
	});

	return json({
		article,
	});
};

type ActionData = {
	errors: {
		content?: string[];
	};
};

export const action: ActionFunction = async ({ request, params: { slug } }) => {
	const user = await getUser(request);
	if (!user) return redirect(`/login?redirectTo=articles/${slug}`);

	const formData = await request.formData();

	const commentData = z
		.object({
			content: z.string().min(1),
		})
		.safeParse({ content: formData.get("content") });

	if (!commentData.success) {
		return json<ActionData>({
			errors: commentData.error.formErrors.fieldErrors,
		});
	}

	const comment = await prisma.comment.create({
		data: {
			article: { connect: { slug } },
			user: { connect: { id: user.id } },
			content: commentData.data.content,
		},
	});

	return redirect(`/articles/${slug}#comment-${comment.id}`);
};

export default function ViewArticle() {
	const user = useOptionalUser();
	const { article } = useLoaderData<LoaderData>();
	const actionData = useActionData<ActionData>();
	return (
		<>
			<div className="article-page">
				<div className="banner">
					<div className="container">
						<h1>{article.title}</h1>

						<div className="article-meta" style={{ display: "flex" }}>
							<Link to={`profiles/${article.user.name}`}>
								<img
									src={article.user.image ?? undefined}
									alt={article.user.name}
								/>
							</Link>
							<div className="info">
								<Link to={`/profiles/${article.user.name}`} className="author">
									{article.user.name}
								</Link>
								<span className="date">
									{new Date(article.createdAt).toLocaleDateString()}
								</span>
							</div>
							<div style={{ display: "flex" }}>
								<Form
									method="post"
									action={`/profiles/${article.user.name}/followers`}
								>
									<button className="btn btn-sm btn-outline-secondary">
										<i className="ion-plus-round"></i>
										&nbsp;
										{article.user.followedBy.some((f) => f.id === user?.id)
											? "Unfollow"
											: "Follow"}{" "}
										{article.user.name}{" "}
										<span className="counter">
											({article.user.followedBy.length})
										</span>
									</button>
								</Form>
								&nbsp;&nbsp;
								<Form
									method="post"
									action={`/articles/${article.slug}/favorites`}
								>
									<button className="btn btn-sm btn-outline-primary">
										<i className="ion-heart"></i>
										&nbsp; Favorite Post{" "}
										<span className="counter">
											({article.favorites.length})
										</span>
									</button>
								</Form>
							</div>
						</div>
					</div>
				</div>

				<div className="page container">
					<div className="row article-content">
						<div
							className="col-md-12"
							dangerouslySetInnerHTML={{ __html: marked(article.content) }}
						></div>
					</div>

					<hr />

					<div className="article-actions">
						<div
							className="article-meta"
							style={{ display: "flex", justifyContent: "center" }}
						>
							<Link to={`profiles/${article.user.name}`}>
								<img
									src={article.user.image ?? undefined}
									alt={article.user.name}
								/>
							</Link>
							<div className="info">
								<Link to={`profiles/${article.user.name}`} className="author">
									{article.user.name}
								</Link>
								<span className="date">
									{new Date(article.createdAt).toLocaleDateString()}
								</span>
							</div>
							<div style={{ display: "flex" }}>
								<Form
									method="post"
									action={`/profiles/${article.user.name}/followers`}
								>
									<button className="btn btn-sm btn-outline-secondary">
										<i className="ion-plus-round"></i>
										&nbsp;{" "}
										{article.user.followedBy.some((f) => f.id === user?.id)
											? "Unfollow"
											: "Follow"}{" "}
										{article.user.name}{" "}
										<span className="counter">
											({article.user.followedBy.length})
										</span>
									</button>
								</Form>
								&nbsp;&nbsp;
								<Form
									method="post"
									action={`/articles/${article.slug}/favorites`}
								>
									<button className="btn btn-sm btn-outline-primary">
										<i className="ion-heart"></i>
										&nbsp; Favorite Post{" "}
										<span className="counter">
											({article.favorites.length})
										</span>
									</button>
								</Form>
							</div>
						</div>
					</div>

					<div className="row">
						<div className="col-xs-12 col-md-8 offset-md-2">
							{!user && (
								<>
									<p className="text-center">
										<Link to="/login">Login</Link> to comment.
									</p>
								</>
							)}
							{user && (
								<Form className="card comment-form" method="post">
									<div className="card-block">
										<textarea
											className="form-control"
											placeholder="Write a comment..."
											rows={3}
											name="content"
										></textarea>
									</div>
									<div className="card-footer">
										<img
											src={user.image ?? undefined}
											className="comment-author-img"
											alt={user.name}
										/>
										<button className="btn btn-sm btn-primary">
											Post Comment
										</button>
									</div>
								</Form>
							)}

							{article.comments.length === 0 && (
								<p className="text-center">No comments yet.</p>
							)}

							{article.comments.length > 0 &&
								article.comments.map((comment) => {
									return (
										<>
											<CommentCard
												comment={comment}
												canEdit={comment.userId === user?.id}
											/>
										</>
									);
								})}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
