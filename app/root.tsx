import type {
	LinksFunction,
	LoaderFunction,
	MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from "@remix-run/react";

import tailwindStylesheetUrl from "./styles/tailwind.css";
import { getUser } from "./session.server";
import Header from "./components/header";
import Footer from "./components/footer";

export const links: LinksFunction = () => {
	return [
		// { rel: "stylesheet", href: tailwindStylesheetUrl },
		{
			rel: "stylesheet",
			href: "//code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css",
		},
		{
			rel: "stylesheet",
			href: "//fonts.googleapis.com/css?family=Titillium+Web:700|Source+Serif+Pro:400,700|Merriweather+Sans:400,700|Source+Sans+Pro:400,300,600,700,300italic,400italic,600italic,700italic",
		},
		{
			rel: "stylesheet",
			href: "//demo.productionready.io/main.css",
		},
	];
};

export const meta: MetaFunction = () => ({
	charset: "utf-8",
	title: "Remix Notes",
	viewport: "width=device-width,initial-scale=1",
});

type LoaderData = {
	user: Awaited<ReturnType<typeof getUser>>;
};

export const loader: LoaderFunction = async ({ request }) => {
	return json<LoaderData>({
		user: await getUser(request),
	});
};

export default function App() {
	const { user } = useLoaderData<LoaderData>();
	return (
		<html lang="en" className="h-full">
			<head>
				<Meta />
				<Links />
			</head>
			<body className="h-full">
				<Header user={user} />
				<Outlet />
				<Footer />
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}
