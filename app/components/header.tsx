import { User } from "@prisma/client";
import { Form, Link } from "@remix-run/react";

export default function Header({ user }: { user?: User | null }) {
  return (
    <>
      <nav className="navbar navbar-light">
        <div className="container">
          <Link className="navbar-brand" to="/">
            conduit
          </Link>
          <ul className="nav navbar-nav pull-xs-right">
            <li className="nav-item">
              <Link className="nav-link active" to="/">
                Home
              </Link>
            </li>
            {user && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/articles/create">
                    <i className="ion-compose"></i>&nbsp;New Article
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/settings">
                    <i className="ion-gear-a"></i>&nbsp;Settings
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to={`/profiles/${user.name}`}>
                    <i className="ion-gear-a"></i>&nbsp;My Profile
                  </Link>
                </li>
                <li className="nav-item">
                  <Form method="post" action="/logout">
                    <button className="nav-link">Logout</button>
                  </Form>
                </li>
              </>
            )}
            {!user && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="login">
                    Sign in
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="register">
                    Sign up
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </nav>
    </>
  );
}
