# Tomodachi-Link Backend

A RESTful API that provides the backend for the Tomodachi-Link Network.

## Live

[TBA](TBA)

## Features

-   Handle the user facing frontend, as well as an admin-panel for content moderation.
-   Authentication and authorization to ensure that data can only be accessed by authorized users.
-   Support for traditional username/password and OAuth authentication.

## Frontend

The source code for the Tomodachi-Link Frontend can be found at [https://github.com/erynder-z/tomodachi-link-frontend](https://github.com/erynder-z/tomodachi-link-frontend).

## Endpoints

| Endpoint                             | Method | Description                                    |
| ------------------------------------ | ------ | ---------------------------------------------- |
| /admin/login                         | POST   | Admin login                                    |
| /admin/dashboard                     | GET    | Fetch dashboard data                           |
| /admin/posts                         | GET    | Fetch posts                                    |
| /admin/post/:id                      | DELETE | Delete a post                                  |
| /admin/users                         | GET    | Fetch users                                    |
| /admin/polls                         | GET    | Fetch polls                                    |
| /admin/poll/:id                      | DELETE | Delete a poll                                  |
| /admin/search                        | GET    | Perform search                                 |
| /key/tenor                           | GET    | Retrieve Tenor API key                         |
| /auth/guest                          | GET    | Retrieve guest login data                      |
| /auth/login                          | POST   | User login                                     |
| /auth/oauth/github                   | GET    | Initiate GitHub OAuth authentication           |
| /auth/oauth/google                   | GET    | Initiate Google OAuth authentication           |
| /auth/oauth/discord                  | GET    | Initiate Discord OAuth authentication          |
| /auth/oauth/redirect                 | GET    | Handle OAuth authentication redirection        |
| /auth/token-user                     | GET    | Check and decode JWT token                     |
| /chat/chat                           | POST   | Initialize a chat conversation                 |
| /chat/chat                           | GET    | Fetch conversations of a user                  |
| /chat/chat/user/:id                  | GET    | Fetch chat partner data                        |
| /chat/chat/:conversationId/mute      | PATCH  | Mute/unmute a chat conversation                |
| /chat/message                        | POST   | Add a chat message to a chat conversation      |
| /chat/message/:conversationId        | GET    | Fetch messages from a chat conversation        |
| /chat/message/:conversationId/unread | PATCH  | Mark a conversation as unread                  |
| /chat/message/:conversationId/read   | PATCH  | Mark a conversation as read                    |
| /comment/comment/:id/create          | POST   | Create a comment                               |
| /feed/feed                           | GET    | Fetch the user feed                            |
| /frienddata/frienddata               | GET    | Fetch friend data                              |
| /picture/users/:id/count_pictures    | GET    | Count the number of posted pictures of a user  |
| /picture/users/:id/picture           | GET    | Fetch the picture list of a user               |
| /poll/poll                           | POST   | Add a new poll                                 |
| /poll/poll/:id/answer                | PATCH  | Submit a poll answer                           |
| /poll/poll/:id/check                 | GET    | Check user answer status for a poll            |
| /poll/poll/:id/details               | GET    | Get details of a single poll                   |
| /poll/collection                     | GET    | Fetch paginated poll collection                |
| /poll/:id/single                     | GET    | Fetch details of a single poll                 |
| /post/users/:id/post                 | GET    | Fetch all posts of a user                      |
| /post/post                           | POST   | Add a new post                                 |
| /post/post/:id                       | DELETE | Delete a post                                  |
| /post/post/:id                       | PATCH  | Edit a post                                    |
| /post/post/:id/positive              | PATCH  | Add a positive reaction to a post              |
| /post/post/:id/negative              | PATCH  | Add a negative reaction to a post              |
| /post/post/:id                       | GET    | Fetch details of a single post                 |
| /search/search                       | GET    | Perform a database search                      |
| /signup/signup                       | POST   | Regular user signup                            |
| /signup/fakesignup                   | POST   | Fake user signup for demonstration purposes    |
| /users/users/count                   | GET    | Count all users in the database                |
| /users/users/some                    | GET    | Fetch a selection of random users              |
| /users/users/all                     | GET    | Fetch all users                                |
| /users/users/maybefriends            | GET    | Fetch a selection of friends of friends        |
| /users/users/:id                     | GET    | Fetch user data of other users                 |
| /users/users/:id/request/send        | PATCH  | Send a friend request                          |
| /users/users/:id/request/accept      | PATCH  | Accept a friend request                        |
| /users/users/:id/request/decline     | PATCH  | Decline a friend request                       |
| /users/users/:id/request/unfriend    | PATCH  | Unfriend a user                                |
| /userdata                            | GET    | Fetch user data of the authenticated user      |
| /userdata                            | PATCH  | Update user data of the authenticated user     |
| /userdata/cover                      | PATCH  | Update cover image of the authenticated user   |
| /defaultfriend                       | PATCH  | Add a default friend to the authenticated user |
| /password                            | PATCH  | Update the password of the authenticated user  |
| /tos/accept                          | PATCH  | Accept some TOS for the authenticated user     |

## Installation

1.  Clone the repository to your local machine: `git clone https://github.com/erynder-z/tomodachi-link-backend.git`
2.  Navigate to the project directory: `cd tomodachi-link-backend`
3.  Install the required dependencies: `npm install`
4.  Start the development server: `npm run serve`

## Usage

### 1. Setup Environment Variables

Before running the application, ensure you have set up the following environment variables in a `.env` file:

```shell
PORT=<yourPort>
MONGODB_URI=<DB_connection_string>
TOKEN_EXPIRE_TIME=<time>
TOKEN_SECRET_KEY=<secret_key_for_JWT_authentication>
CORS_ACCESS=<URL_of_frontend_server>
TENOR_API_KEY=<your_Google_Tenor_API_key>
GITHUB_CLIENT_ID=<Github_OAUTH_client_id>
GITHUB_CLIENT_SECRET=<Github_OAUTH_client_SECRET>
GITHUB_CALLBACK_URL=<URL_for_the_Github_OAUTH_callback>
GOOGLE_CLIENT_ID=<Google_OAUTH_client_id>
GOOGLE_CLIENT_SECRET=<Google_OAUTH_client_SECRET>
GOOGLE_CALLBACK_URL=<URL_for_the_Google_OAUTH_callback>
DISCORD_CLIENT_ID=<Discord_OAUTH_client_id>
DISCORD_CLIENT_SECRET=<Discord_OAUTH_client_SECRET>
DISCORD_CALLBACK_URL=<URL_for_the_Discord_OAUTH_callback>
DISCORD_OAUTH_PLACEHOLDER_PASSWORD=<password_for_internal_usage_during_OAUTH_login>
OAUTH_CALLBACK_REDIRECT_URL=<URL_the_OAUTH_redirects_to>
GUEST_USERNAME=<internal_username_for_the_guest_account>
GUEST_PASSWORD=<internal_password_for_the_guest_account>
FAKE_SIGNUP_PASSWORD=<internal_password_for_fake_account_creation>
ADMIN_TOKEN_SECRET_KEY=<secret_key_for_admin_auth>
ADMIN_TOKEN_EXPIRE_TIME=<time>
ADMIN_HASHED_PASSWORD=<admin_password_hash>
```

### 2. Install Tomodachi-Link Frontend

To interact with the API, you need to install and run the [Tomodachi-Link Frontend](https://github.com/erynder-z/tomodachi-link-frontend). This frontend application provides the user interface for accessing the API functionalities.

## Acknowledgments

-   [Async](https://caolan.github.io/async/) - A library that helps with asynchronous flow control.
-   [Bcrypt](https://www.npmjs.com/package/bcrypt) - A library for password hashing.
-   [Compression](https://github.com/expressjs/compression) - A middleware for compressing HTTP responses.
-   [Cookie-Parser](https://github.com/expressjs/cookie-parser) - A middleware for parsing HTTP cookies.
-   [Cors](https://github.com/expressjs/cors) - A middleware for providing Cross-Origin Resource Sharing.
-   [Debug](https://github.com/visionmedia/debug) - A utility for debugging Node.js applications.
-   [Dotenv](https://github.com/motdotla/dotenv) - A zero-dependency module that loads environment variables from a .env file.
-   [ESLint](https://eslint.org/) - A tool for identifying and reporting on patterns found in ECMAScript/JavaScript code.
-   [Express](https://expressjs.com/) - A Node.js framework that was used to build the API.
-   [Express-Validator](https://github.com/express-validator/express-validator) - A set of express.js middlewares that wraps validator.js validator and sanitizer functions.
-   [Faker](https://www.npmjs.com/package/faker) - A library for generating fake data.
-   [Helmet](https://helmetjs.github.io/) - A collection of middlewares that help secure Express applications by setting various HTTP headers.
-   [Jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) - A library for JSON Web Tokens (JWT).
-   [MongoDB](https://www.mongodb.com/) - A database that was used to store the blog data.
-   [Mongoose](https://mongoosejs.com/) - An Object Data Modeling (ODM) library for MongoDB.
-   [Morgan](https://github.com/expressjs/morgan) - A middleware for logging HTTP requests.
-   [Multer](https://github.com/expressjs/multer) - A middleware for handling multipart/form-data.
-   [Obscenity](https://github.com/raisely/obscenity) - A library for filtering and replacing profane words.
-   [Passport](http://www.passportjs.org/) - An authentication middleware for Node.js.
-   [Passport-Discord](https://github.com/nicholascrubin/passport-discord) - Passport strategy for authenticating with Discord.
-   [Passport-Github2](https://github.com/cfsghost/passport-github) - Passport strategy for authenticating with GitHub.
-   [Passport-Google-OAuth20](http://www.passportjs.org/packages/passport-google-oauth20/) - Passport strategy for authenticating with Google using OAuth 2.0.
-   [Passport-Jwt](https://github.com/mikenicholson/passport-jwt) - A Passport strategy for authenticating with a JSON Web Token (JWT).
-   [Passport-Local](https://github.com/jaredhanson/passport-local) - A Passport strategy for authenticating with a username and password.
-   [Prettier](https://prettier.io/) - A tool to format code automatically.
-   [Rimraf](https://github.com/isaacs/rimraf) - A `rm -rf` util for node that works cross-platform.
-   [Socket.io](https://socket.io/) - A library for real-time web applications.
-   [Unique-Names-Generator](https://www.npmjs.com/package/unique-names-generator) - A library for generating unique random names.
-   [Concurrently](https://github.com/kimmobrunfeldt/concurrently) - A tool that runs multiple commands concurrently.
-   [Nodemon](https://nodemon.io/) - A utility that automatically restarts the node application when file changes in the directory are detected.
-   [TypeScript](https://www.typescriptlang.org/) - A statically-typed superset of JavaScript that was used for this project.
