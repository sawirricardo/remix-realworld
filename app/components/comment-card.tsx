import { Comment, User } from "@prisma/client";
import { Link } from "@remix-run/react";

export default function CommentCard({
	comment,
	canEdit = false,
}: {
	comment: Comment & {
		user: User;
	};
	canEdit?: boolean;
}) {
	return (
		<>
			<div className="card" id={`comment-${comment.id}`}>
				<div className="card-block">
					<p className="card-text">{comment.content}</p>
				</div>
				<div className="card-footer">
					<Link to={`profiles/${comment.user.name}`} className="comment-author">
						<img
							src={comment.user.image ?? undefined}
							className="comment-author-img"
							alt={comment.user.name}
						/>
					</Link>
					&nbsp;
					<Link to={`profiles/${comment.user.name}`} className="comment-author">
						Jacob Schmidt
					</Link>
					<span className="date-posted">
						{new Date(comment.createdAt).toLocaleDateString()}
					</span>
					{canEdit && (
						<span className="mod-options">
							<i className="ion-edit"></i>
							<i className="ion-trash-a"></i>
						</span>
					)}
				</div>
			</div>
		</>
	);
}
