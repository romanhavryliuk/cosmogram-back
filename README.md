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

`201 Created` — registering logs the user straight in, so the response carries
the same token pair as `/login`.

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { "id": "66b0f1a2c3d4e5f607a8b9c0", "name": "Ihor", "email": "user@mail.com" }
}
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
  "user": { "id": "66b0f1a2c3d4e5f607a8b9c0", "name": "Ihor", "email": "user@mail.com" }
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

`200 OK` — the user object is returned bare, without a wrapper.

```json
{ "id": "66b0f1a2c3d4e5f607a8b9c0", "name": "Ihor", "email": "user@mail.com" }
```

### POST /api/auth/logout

`204 No Content` — the refresh token is revoked, so the session cannot be
extended. The access token is not stored server-side and stays valid until it
expires on its own (`ACCESS_TOKEN_TTL`, 15 minutes by default).

## Profiles API

Base path: `/api/profiles`. Every route needs a Bearer token, and a profile is
only ever visible to the user who created it — someone else's id reads as `404`.

| Method | Endpoint | Description                                        |
| ------ | -------- | -------------------------------------------------- |
| GET    | `/`      | Saved cosmograms of the current user, newest first |
| GET    | `/:id`   | One cosmogram with all computed blocks             |
| POST   | `/`      | Create a cosmogram from birth data                 |
| PATCH  | `/:id`   | Edit the name or the birth data                    |
| DELETE | `/:id`   | Delete a cosmogram                                 |
| POST   | `/:id/share` | Turn on the public link, returns its `shareId` |
| DELETE | `/:id/share` | Turn the public link off                       |

### POST /api/profiles

```json
{
  "name": "Maria",
  "birthDate": "1998-03-15",
  "birthTime": "14:30",
  "place": {
    "label": "Lviv, Ukraine",
    "latitude": 49.8397,
    "longitude": 24.0297,
    "timezone": "Europe/Kyiv"
  }
}
```

`birthDate` is `yyyy-MM-dd` and `birthTime` is `HH:mm`, both local to the birth
place — they are stored as strings so no timezone ever shifts them.

`birthTime` is optional: omit it or send `null` when it is unknown. The chart is
then cast for local noon (the Moon can be off by up to ~7°), and everything that
depends on the exact time is left out: `chart.houses` is `[]`, `ascendant`,
`midheaven` and each planet's `house` are absent. The response carries
`"birthTime": null`. The destiny matrix and the Pythagorean square use only the
date and are unaffected.

`201 Created` — the natal chart, the destiny matrix and the Pythagorean square
are computed once here and stored, so reads never recalculate anything.

```json
{
  "id": "66b0f1a2c3d4e5f607a8b9c1",
  "ownerId": "66b0f1a2c3d4e5f607a8b9c0",
  "name": "Maria",
  "birthDate": "1998-03-15",
  "birthTime": "14:30",
  "place": {
    "label": "Lviv, Ukraine",
    "latitude": 49.8397,
    "longitude": 24.0297,
    "timezone": "Europe/Kyiv"
  },
  "createdAt": "2026-08-16T10:00:00.000Z",
  "chart": {
    "planets": [
      {
        "planet": "sun",
        "sign": "sagittarius",
        "degree": 23.4,
        "longitude": 263.4,
        "house": 12,
        "retrograde": false
      }
    ],
    "houses": [{ "house": 1, "sign": "scorpio", "longitude": 217.4 }],
    "aspects": [{ "from": "sun", "to": "moon", "type": "trine", "orb": 1.4 }],
    "ascendant": 217.4,
    "midheaven": 127.4
  },
  "destinyMatrix": {
    "center": 9,
    "personal": { "a": 15, "b": 3, "c": 9, "d": 9 },
    "karmic": { "e": 18, "f": 12, "g": 18, "h": 6 },
    "money": 18,
    "love": 12
  },
  "pythagoreanSquare": { "1": "11", "3": "3", "5": "5", "8": "8", "9": "99" }
}
```

### GET /api/profiles

`200 OK` — dashboard cards, without the computed blocks. `sunSign` and
`centralArcana` are lifted out of the stored chart and destiny matrix for the
card preview, so the frontend does not recompute them.

```json
[
  {
    "id": "66b0f1a2c3d4e5f607a8b9c1",
    "name": "Maria",
    "birthDate": "1998-03-15",
    "createdAt": "2026-08-16T10:00:00.000Z",
    "place": { "label": "Lviv, Ukraine" },
    "sunSign": "pisces",
    "centralArcana": 9
  }
]
```

### PATCH /api/profiles/:id

Any subset of the `POST` fields, at least one. `place` is replaced as a whole,
so it needs all four of its fields.

```json
{ "name": "Maria K.", "birthTime": null }
```

`200 OK` — the full updated profile, same shape as `POST`. Renaming keeps the
stored blocks; changing `birthDate`, `birthTime` or `place` recomputes all of
them. `updatedAt` is set on every edit (profiles created before editing existed
lack it until their first one).

### DELETE /api/profiles/:id

`204 No Content`

### POST /api/profiles/:id/share

`200 OK` — `{ "shareId": "kq3V0bXh2mZp9cRw" }`. Idempotent: sharing an already
shared profile returns the same id, so links already sent keep working. Every
profile also carries `shareId` (`null` while not shared).

### DELETE /api/profiles/:id/share

`204 No Content` — the link stops working. Sharing again issues a new `shareId`,
so a revoked link never comes back.

## Share API

`GET /api/share/:shareId` — no auth. `200 OK` with the profile as `GET
/api/profiles/:id` returns it, minus `id`, `ownerId`, `shareId`, the
timestamps and the place coordinates — `place` is just `{ "label": "..." }`.
`404` if the link was never issued or has been turned off.

The link preview image is rendered by the frontend (`next/og`) from this
response; the backend serves data only.

## Errors

Every error is returned in the same shape:

```json
{ "message": "Email or password is wrong" }
```

`400` — validation error, `401` — not authorized, `404` — unknown route, `409` — conflict,
`429` — rate limit hit, `500` — server error.

## Preview API

`POST /api/preview` — no auth. Lets a guest see their result before signing up.
Takes the same body as `POST /api/profiles`, computes everything and returns it
without saving: `200 OK` with the profile shape minus `id`, `ownerId` and the
timestamps. To keep it after signing up, the frontend sends the same body to
`POST /api/profiles`.

Rate-limited to 20 requests per 15 minutes per IP; past that it answers `429`.

## Places API

Base path: `/api/places`. No auth — the guest form needs it too. The geocoding
key is quota-limited (2,500 requests/day on the free OpenCage tier), so the
route is rate-limited to 60 requests per 15 minutes per IP (`429` past that).

| Method | Endpoint | Description                                  |
| ------ | -------- | --------------------------------------------- |
| GET    | `/?query=` | Birth place autocomplete, via OpenCage       |

```json
[
  {
    "label": "Lviv, Lviv Raion, Ukraine",
    "latitude": 49.841952,
    "longitude": 24.0315921,
    "timezone": "Europe/Kyiv"
  }
]
```

Results without a resolvable IANA timezone are dropped — a place without one
cannot become a valid profile (`place.timezone` is required).

## Not implemented yet

- The destiny matrix reduction in `numerology-service.js` follows one of
  several traditions; confirm the method against the project brief. The
  Pythagorean square (with its four working numbers) is already computed
  the way the classic method defines it.
