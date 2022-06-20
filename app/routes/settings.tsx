import { User } from "@prisma/client";
import { Response } from "@remix-run/node";
import {
	Form,
	useActionData,
	useLoaderData,
	useTransition,
} from "@remix-run/react";
import z, { ZodError } from "zod";
import {
	ActionFunction,
	json,
	LoaderFunction,
	redirect,
} from "@remix-run/server-runtime";
import { getUser } from "~/session.server";
import { updatePassword } from "~/models/user.server";
import { prisma } from "~/db.server";

type LoaderData = {
	user: User;
};

export const loader: LoaderFunction = async ({ request }) => {
	const user = await getUser(request);
	if (!user) return redirect("/login");
	return json<LoaderData>({ user });
};

type ActionData = {
	errors?: {
		name?: string[];
		email?: string[];
		bio?: string[];
		image?: string[];
	};
};

export const action: ActionFunction = async ({ request }) => {
	const user = await getUser(request);
	if (!user) return redirect("/login");

	const formData = await request.formData();
	if (request.method !== "PUT") {
		throw new Response("Method not allowed", {
			status: 405,
		});
	}
	const newPassword = formData.get("password");
	if (newPassword) {
		await updatePassword(user, newPassword.toString());
	}

	const userData = await z
		.object({
			name: z
				.string()
				.min(1)
				.refine(
					async (name) =>
						await prisma.user
							.findFirst({ where: { name, NOT: { id: user.id } } })
							.then((userFromDb) => !userFromDb)
				),
			email: z
				.string()
				.min(1)
				.email()
				.refine(
					async (email) =>
						await prisma.user
							.findFirst({ where: { email, NOT: { id: user.id } } })
							.then((userFromDb) => !userFromDb)
				),
			bio: z.string().optional(),
			image: z.string().url().optional(),
		})
		.safeParseAsync({
			name: formData.get("name"),
			email: formData.get("email"),
			bio: formData.get("bio"),
			image: formData.get("image"),
		});

	if (!userData.success) {
		return json<ActionData>({
			errors: userData.error.formErrors.fieldErrors,
		});
	}

	await prisma.user.update({
		where: { id: user.id },
		data: userData.data,
	});

	return redirect("/settings");
};
export default function SettingsPage() {
	const { user } = useLoaderData<LoaderData>();
	const transition = useTransition();
	const actionData = useActionData() as ActionData;
	return (
		<>
			<div className="settings-page">
				<div className="page container">
					<div className="row">
						<div className="col-md-6 offset-md-3 col-xs-12">
							<h1 className="text-xs-center">Your Settings</h1>

							<Form method="put">
								<fieldset>
									<fieldset className="form-group">
										<input
											className="form-control"
											type="text"
											placeholder="URL of profile picture"
											name="image"
											defaultValue={user.image ?? undefined}
											disabled={transition.state === "submitting"}
											required
										/>
										{actionData?.errors?.image && (
											<div className="error-messages">
												{actionData.errors.image.join(", ")}
											</div>
										)}
									</fieldset>
									<fieldset className="form-group">
										<input
											className="form-control form-control-lg"
											type="text"
											placeholder="Your Name"
											name="name"
											defaultValue={user.name ?? undefined}
											disabled={transition.state === "submitting"}
											required
										/>
										{actionData?.errors?.name && (
											<div className="error-messages">
												{actionData.errors.name.join(", ")}
											</div>
										)}
									</fieldset>
									<fieldset className="form-group">
										<textarea
											className="form-control form-control-lg"
											rows={8}
											placeholder="Short bio about you"
											name="bio"
											defaultValue={user.bio ?? undefined}
											disabled={transition.state === "submitting"}
										></textarea>
										{actionData?.errors?.bio && (
											<div className="error-messages">
												{actionData.errors.bio.join(", ")}
											</div>
										)}
									</fieldset>
									<fieldset className="form-group">
										<input
											className="form-control form-control-lg"
											type="email"
											placeholder="Email"
											name="email"
											defaultValue={user.email ?? undefined}
											disabled={transition.state === "submitting"}
											required
										/>
										{actionData?.errors?.email && (
											<div className="error-messages">
												{actionData.errors.email.join(", ")}
											</div>
										)}
									</fieldset>
									<fieldset className="form-group">
										<input
											className="form-control form-control-lg"
											type="password"
											placeholder="Password"
											name="password"
											disabled={transition.state === "submitting"}
										/>
									</fieldset>
									<button
										className="btn btn-lg btn-primary pull-xs-right"
										disabled={transition.state == "submitting"}
									>
										Update Settings
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
