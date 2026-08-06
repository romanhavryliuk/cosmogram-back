# cosmogram-back

Backend for the Cosmogram app: Express + MongoDB (Mongoose), JWT auth.

## Getting started

```bash
npm install
cp .env.example .env   # fill in DB_HOST and the secret keys
npm run dev
```

## Auth API

Base path: `/api/auth`. All request/response bodies are JSON.

| Method | Endpoint    | Auth   | Description                             |
| ------ | ----------- | ------ | --------------------------------------- |
| POST   | `/register` | —      | Create an account                       |
| POST   | `/login`    | —      | Log in, returns a token pair            |
| POST   | `/refresh`  | —      | Exchange a refresh token for a new pair |
| GET    | `/current`  | Bearer | Current user                            |
| POST   | `/logout`   | Bearer | Invalidate both tokens                  |

Protected routes expect the access token in the header:

```
Authorization: Bearer <accessToken>
```

### POST /api/auth/register

```json
{ "name": "Ihor", "email": "user@mail.com", "password": "12345678" }
```

`201 Created`

```json
{ "user": { "name": "Ihor", "email": "user@mail.com" } }
```

`409` — email is already in use.

### POST /api/auth/login

```json
{ "email": "user@mail.com", "password": "12345678" }
```

`200 OK`

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { "name": "Ihor", "email": "user@mail.com" }
}
```

`401` — email or password is wrong.

### POST /api/auth/refresh

```json
{ "refreshToken": "..." }
```

`200 OK`

```json
{ "accessToken": "...", "refreshToken": "..." }
```

`401` — the refresh token is invalid, expired, or no longer the one stored for the user.

### GET /api/auth/current

`200 OK`

```json
{ "user": { "name": "Ihor", "email": "user@mail.com" } }
```

### POST /api/auth/logout

`204 No Content` — both tokens are cleared, the access token stops working immediately.

### Errors

Every error is returned in the same shape:

```json
{ "message": "Email or password is wrong" }
```

`400` — validation error, `401` — not authorized, `404` — unknown route, `409` — conflict,
`500` — server error.
