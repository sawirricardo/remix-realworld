import type { Article, Tag, User } from "@prisma/client";
import { Form, Link } from "@remix-run/react";

export default function ArticlePreview({
	article,
}: {
	article: Article & {
		user: User;
		favorites: User[];
		tags: Tag[];
	};
}) {
	return (
		<>
			<div className="article-preview">
				<div className="article-meta">
					<Link to={`/profiles/${article.user.name}`}>
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

					<Form method="post" action={`/articles/${article.slug}/favorites`}>
						<button className="btn btn-outline-primary btn-sm pull-xs-right">
							<i className="ion-heart"></i> {article.favorites.length}
						</button>
					</Form>
				</div>
				<Link to={`/articles/${article.slug}`} className="preview-link">
					<h1>{article.title}</h1>
					<p>{article.excerpt}</p>
					<span>Read more...</span>
					{article.tags.length > 0 && (
						<ul className="tag-list">
							{article.tags.map((tag, index) => (
								<li
									className="tag-default tag-pill tag-outline"
									key={`tag_${index}`}
								>
									{tag.name}
								</li>
							))}
						</ul>
					)}
				</Link>
			</div>
		</>
	);
}
