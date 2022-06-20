import type {
	ActionFunction,
	LoaderFunction,
	MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import * as React from "react";

import { createUserSession, getUserId } from "~/session.server";
import { verifyLogin } from "~/models/user.server";
import { safeRedirect, validateEmail } from "~/utils";

export const loader: LoaderFunction = async ({ request }) => {
	const userId = await getUserId(request);
	if (userId) return redirect("/");
	return json({});
};

interface ActionData {
	errors?: {
		email?: string;
		password?: string;
	};
}

export const action: ActionFunction = async ({ request }) => {
	const formData = await request.formData();
	const email = formData.get("email");
	const password = formData.get("password");
	const redirectTo = safeRedirect(formData.get("redirectTo"), "/");
	const remember = formData.get("remember");

	if (!validateEmail(email)) {
		return json<ActionData>(
			{ errors: { email: "Email is invalid" } },
			{ status: 400 }
		);
	}

	if (typeof password !== "string" || password.length === 0) {
		return json<ActionData>(
			{ errors: { password: "Password is required" } },
			{ status: 400 }
		);
	}

	if (password.length < 8) {
		return json<ActionData>(
			{ errors: { password: "Password is too short" } },
			{ status: 400 }
		);
	}

	const user = await verifyLogin(email, password);

	if (!user) {
		return json<ActionData>(
			{ errors: { email: "Invalid email or password" } },
			{ status: 400 }
		);
	}

	return createUserSession({
		request,
		userId: user.id,
		remember: remember === "on" ? true : false,
		redirectTo,
	});
};

export const meta: MetaFunction = () => {
	return {
		title: "Login",
	};
};

export default function LoginPage() {
	const [searchParams] = useSearchParams();
	const redirectTo = searchParams.get("redirectTo");
	const actionData = useActionData() as ActionData;
	const emailRef = React.useRef<HTMLInputElement>(null);
	const passwordRef = React.useRef<HTMLInputElement>(null);

	React.useEffect(() => {
		if (actionData?.errors?.email) {
			emailRef.current?.focus();
		} else if (actionData?.errors?.password) {
			passwordRef.current?.focus();
		}
	}, [actionData]);

	return (
		<div className="auth-page">
			<div className="page container">
				<div className="row">
					<div className="col-md-6 offset-md-3 col-xs-12">
						<h1 className="text-xs-center">Sign in</h1>
						<p className="text-xs-center">
							<Link to={"register"}>Doesn't have an account?</Link>
						</p>

						<Form method="post">
							<input
								type="hidden"
								name="redirectTo"
								value={redirectTo ?? undefined}
							/>
							<fieldset className="form-group">
								<input
									className="form-control form-control-lg"
									type="text"
									placeholder="Email"
									name="email"
									ref={emailRef}
									autoFocus={true}
									autoComplete="email"
									aria-invalid={actionData?.errors?.email ? true : undefined}
									aria-describedby="email-error"
									required
								/>
								{actionData?.errors?.email && (
									<ul className="error-messages">
										<li id="email-error">{actionData.errors.email}</li>
									</ul>
								)}
							</fieldset>
							<fieldset className="form-group">
								<input
									className="form-control form-control-lg"
									type="password"
									placeholder="Password"
									name="password"
									ref={passwordRef}
									autoComplete="current-password"
									aria-invalid={actionData?.errors?.password ? true : undefined}
									aria-describedby="password-error"
									required
								/>
								{actionData?.errors?.password && (
									<ul className="error-messages">
										<li id="password-error">{actionData.errors.password}</li>
									</ul>
								)}
							</fieldset>
							<button className="btn btn-lg btn-primary pull-xs-right">
								Sign in
							</button>
						</Form>
					</div>
				</div>
			</div>
		</div>
	);
}
