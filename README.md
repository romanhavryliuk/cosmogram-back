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

`204 No Content` — both tokens are cleared, the access token stops working immediately.

## Profiles API

Base path: `/api/profiles`. Every route needs a Bearer token, and a profile is
only ever visible to the user who created it — someone else's id reads as `404`.

| Method | Endpoint | Description                                        |
| ------ | -------- | -------------------------------------------------- |
| GET    | `/`      | Saved cosmograms of the current user, newest first |
| GET    | `/:id`   | One cosmogram with all computed blocks             |
| POST   | `/`      | Create a cosmogram from birth data                 |
| DELETE | `/:id`   | Delete a cosmogram                                 |

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

`200 OK` — dashboard cards, without the computed blocks.

```json
[
  {
    "id": "66b0f1a2c3d4e5f607a8b9c1",
    "name": "Maria",
    "birthDate": "1998-03-15",
    "createdAt": "2026-08-16T10:00:00.000Z",
    "place": { "label": "Lviv, Ukraine" }
  }
]
```

### DELETE /api/profiles/:id

`204 No Content`

## Errors

Every error is returned in the same shape:

```json
{ "message": "Email or password is wrong" }
```

`400` — validation error, `401` — not authorized, `404` — unknown route, `409` — conflict,
`500` — server error.

## Not implemented yet

- `GET /api/places?query=` — birth place autocomplete. `PlaceAutocomplete` on
  the frontend calls it, so the create form cannot pick a place until it
  exists. It needs a geocoder that also returns an IANA timezone.
- Real planet positions. `astrology-service.js` derives longitudes from a
  deterministic hash of the birth data: the chart is stable and structurally
  valid, but not astronomically true. Everything built on top of the
  longitudes — signs, degrees, houses, aspects, the ascendant — is final and
  survives the swap to a real ephemeris.
- The destiny matrix reduction in `numerology-service.js` follows one of
  several traditions; confirm the method against the project brief. The
  Pythagorean square is already computed the way the frontend documents it.
