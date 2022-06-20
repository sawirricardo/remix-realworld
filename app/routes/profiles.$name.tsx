import { Article, Tag, User } from "@prisma/client";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { json, LoaderFunction } from "@remix-run/server-runtime";
import ArticlePreview from "~/components/article-preview";
import { prisma } from "~/db.server";
import { useOptionalUser } from "~/utils";

type LoaderData = {
	user?:
		| null
		| (User & {
				articles: (Article & {
					user: User;
					favorites: User[];
					tags: Tag[];
				})[];
				followedBy: User[];
		  });
};

export const loader: LoaderFunction = async ({ request, params }) => {
	const user = await prisma.user.findFirst({
		where: { name: params.name },
		include: {
			followedBy: true,
			articles: {
				include: {
					tags: true,
					user: true,
					favorites: true,
				},
			},
		},
	});

	return json<LoaderData>({
		user,
	});
};

export default function ViewProfile() {
	const authUser = useOptionalUser();
	const { user } = useLoaderData<LoaderData>();
	return (
		<>
			<div className="profile-page">
				<div className="user-info">
					<div className="container">
						<div className="row">
							<div
								className="col-xs-12 col-md-10 offset-md-1"
								style={{
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
								}}
							>
								<img
									src={user?.image ?? undefined}
									className="user-img"
									alt={user?.name}
								/>
								<h4>{user?.name}</h4>
								<p>{user?.bio}</p>
								<Form
									method="post"
									action={`/profiles/${user?.name}/followers`}
								>
									<button className="btn btn-sm btn-outline-secondary action-btn">
										<i className="ion-plus-round"></i>
										&nbsp;{" "}
										{user?.followedBy.some((user) => {
											return user.id === authUser?.id;
										})
											? "Unfollow"
											: "Follow"}{" "}
										{user?.name}
									</button>
								</Form>
							</div>
						</div>
					</div>
				</div>

				<div className="container">
					<div className="row">
						<div className="col-xs-12 col-md-10 offset-md-1">
							<div className="articles-toggle">
								<ul className="nav nav-pills outline-active">
									<li className="nav-item">
										<Link
											className="nav-link active"
											to={`profiles/${user?.name}`}
										>
											My Articles
										</Link>
									</li>
									<li className="nav-item">
										<Link
											className="nav-link"
											to={`/profiles/${user?.name}/favorites`}
										>
											Favorited Articles
										</Link>
									</li>
								</ul>
							</div>

							{user?.articles.length === 0 && (
								<p className="text-center">
									This author hasn't published any article yet
								</p>
							)}
							{(user?.articles?.length ?? 0) > 0 &&
								user?.articles.map((article) => {
									return <ArticlePreview key={article.id} article={article} />;
								})}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
