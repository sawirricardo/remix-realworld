import { Response } from "@remix-run/node";
import { Form, Link, useActionData, useTransition } from "@remix-run/react";
import {
	ActionFunction,
	json,
	LoaderFunction,
	redirect,
} from "@remix-run/server-runtime";
import { createUserSession, getUser } from "~/session.server";
import { z } from "zod";
import { prisma } from "~/db.server";
import { createUser } from "~/models/user.server";

type ActionData = {
	errors?: {
		name?: string[];
		email?: string[];
		password?: string[];
	};
};

export const action: ActionFunction = async ({ request }) => {
	const user = await getUser(request);
	if (user) return redirect("/");

	if (request.method !== "POST") {
		throw new Response("Method not allowed", {
			status: 405,
		});
	}

	const formData = await request.formData();

	const userData = await z
		.object({
			password: z.string().trim().min(1).max(255),
			passwordConfirmation: z.string().trim().min(1).max(255),
			name: z
				.string()
				.trim()
				.min(1)
				.max(255)
				.refine(
					async (name) =>
						await prisma.user
							.findFirst({ where: { name } })
							.then((user) => !user)
				),
			email: z
				.string()
				.email()
				.trim()
				.min(1)
				.max(255)
				.refine(
					async (email) =>
						await prisma.user
							.findFirst({ where: { email } })
							.then((user) => !user)
				),
		})
		.refine((data) => data.password === data.passwordConfirmation, {
			message: "Password and password confirmation must match",
		})
		.safeParseAsync({
			name: formData.get("name"),
			email: formData.get("email"),
			password: formData.get("password"),
			passwordConfirmation: formData.get("password_confirmation"),
		});

	if (!userData.success) {
		return json({
			errors: userData.error.formErrors.fieldErrors,
		});
	}

	const newUser = await createUser(
		userData.data.name,
		userData.data.email,
		userData.data.password
	);

	return createUserSession({
		request,
		userId: newUser.id,
		remember: false,
		redirectTo: "/",
	});
};

export const loader: LoaderFunction = async ({ request }) => {
	const user = await getUser(request);
	if (user) return redirect("/");
	return json({});
};

export default function RegisterPage() {
	const transition = useTransition();
	const actionData = useActionData<ActionData>();
	return (
		<>
			<div className="auth-page">
				<div className="page container">
					<div className="row">
						<div className="col-md-6 offset-md-3 col-xs-12">
							<h1 className="text-xs-center">Sign up</h1>
							<p className="text-xs-center">
								<Link to="login">Have an account?</Link>
							</p>

							<Form method="post">
								<fieldset className="form-group">
									<input
										className="form-control form-control-lg"
										type="text"
										placeholder="Your Name"
										name="name"
										required
										disabled={transition.state === "submitting"}
									/>
									{actionData?.errors?.name && (
										<ul className="error-messages">
											<li id="name-error">
												{actionData.errors.name.join(", ")}
											</li>
										</ul>
									)}
								</fieldset>
								<fieldset className="form-group">
									<input
										className="form-control form-control-lg"
										type="text"
										placeholder="Email"
										name="email"
										required
										disabled={transition.state === "submitting"}
									/>
									{actionData?.errors?.email && (
										<ul className="error-messages">
											<li id="email-error">
												{actionData.errors.email.join(", ")}
											</li>
										</ul>
									)}
								</fieldset>
								<fieldset className="form-group">
									<input
										className="form-control form-control-lg"
										type="password"
										placeholder="Password"
										name="password"
										required
										disabled={transition.state === "submitting"}
									/>
									{actionData?.errors?.password && (
										<ul className="error-messages">
											<li id="password-error">
												{actionData.errors.password.join(", ")}
											</li>
										</ul>
									)}
								</fieldset>
								<fieldset className="form-group">
									<input
										className="form-control form-control-lg"
										type="password"
										placeholder="Re-enter Password"
										name="password_confirmation"
										required
										disabled={transition.state === "submitting"}
									/>
								</fieldset>
								<button
									className="btn btn-lg btn-primary pull-xs-right"
									disabled={transition.state === "submitting"}
								>
									Sign up
								</button>
							</Form>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
