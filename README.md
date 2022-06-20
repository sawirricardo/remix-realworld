# ![Remix Example App]()

> ### Remix codebase containing real world examples (CRUD, auth, advanced patterns, etc) that adheres to the [RealWorld](https://github.com/gothinkster/realworld-example-apps) spec and API.

<a href="https://remix-realworld-production.up.railway.app/" target="_blank"><img width="187" src="https://github.com/gothinkster/realworld/blob/master/media/edit_on_blitz.png?raw=true" /></a>&nbsp;&nbsp;

### [Demo](https://remix-realworld-production.up.railway.app/)&nbsp;&nbsp;&nbsp;&nbsp;[RealWorld](https://github.com/gothinkster/realworld)

## Getting started

You can view a live demo over at https://remix-realworld-production.up.railway.app/

To get the frontend running locally:

- Clone this repo
- `npm install` to install all req'd dependencies
- `npm run setup` to initialize the migration of the database. Currently it is setup for postgres, simply change the DATABASE_URL as you see fit.
- `npm run build` to build the server
- `npm run dev`

Local web server will use port 3000

## Functionality overview

The example application is a social blogging site (i.e. a Medium.com clone) called "Conduit". It uses a custom API for all requests, including authentication. You can view a live demo over at https://redux.productionready.io/

**General functionality:**

- Authenticate users via NodeJS Session
- CRU\* users (sign up & settings page - no deleting required)
- CRUD Articles
- CR\*D Comments on articles (no updating required)
- Favorite articles
- Follow other users

**The general page breakdown looks like this:**

- Home page (URL: /#/ )
  - List of tags
  - List of articles pulled from either Feed, Global, or by Tag
  - Pagination for list of articles
- Sign in/Sign up pages (URL: /#/login, /#/register )
  - Use JWT (store the token in localStorage)
- Settings page (URL: /#/settings )
- Article page (URL: /#/articles/article-slug-here )
  - Delete article button (only shown to article's author)
  - Render markdown from server client side
  - Comments section at bottom of page
  - Delete comment button (only shown to comment's author)
- Profile page (URL: /#/@username, /#/@username/favorites )
  - Show basic user info
  - List of articles populated from author's created articles or author's favorited articles

<br />

[![Brought to you by Thinkster](https://raw.githubusercontent.com/gothinkster/realworld/master/media/end.png)](https://thinkster.io)
