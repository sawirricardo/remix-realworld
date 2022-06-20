import { Article, Tag, User } from "@prisma/client";
import { fetch } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { json, LoaderFunction } from "@remix-run/server-runtime";
import ArticlePreview from "~/components/article-preview";
import { prisma } from "~/db.server";

import { useOptionalUser } from "~/utils";

type LoaderData = {
	tags: Tag[];
	articles: (Article & {
		user: User;
		favorites: User[];
		tags: Tag[];
	})[];
};

export const loader: LoaderFunction = async ({ request }) => {
	const [tags, articles] = await Promise.all([
		prisma.tag.findMany(),
		prisma.article.findMany({
			include: {
				user: true,
				favorites: true,
				tags: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		}),
	]);
	return json<LoaderData>({
		tags,
		articles,
	});
};

export default function Index() {
	const user = useOptionalUser();
	const { tags, articles } = useLoaderData<LoaderData>();
	return (
		<>
			<div className="home-page">
				<div className="banner">
					<div className="container">
						<h1 className="logo-font">conduit</h1>
						<p>A place to share your knowledge.</p>
					</div>
				</div>

				<div className="page container">
					<div className="row">
						<div className="col-md-9">
							<div className="feed-toggle">
								<ul className="nav nav-pills outline-active">
									<li className="nav-item">
										<Link
											className="nav-link"
											to="/feed"
											aria-disabled={!!user}
										>
											Your Feed
										</Link>
									</li>
									<li className="nav-item">
										<Link className="nav-link" to="/">
											Global Feed
										</Link>
									</li>
								</ul>
							</div>

							{articles.length > 0 &&
								articles.map((article, index) => {
									return (
										<>
											<ArticlePreview
												key={`article_${index}`}
												article={article}
											/>
										</>
									);
								})}
						</div>

						<div className="col-md-3">
							<div className="sidebar">
								<p>Popular Tags</p>

								<div className="tag-list">
									{tags.map((tag, index) => {
										return (
											<>
												<Link
													to={`/articles?tag=${tag.name}`}
													key={`tag_${tag.name}`}
													className="tag-default tag-pill"
												>
													{tag.name}
												</Link>
											</>
										);
									})}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
