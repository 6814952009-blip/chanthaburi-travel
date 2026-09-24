# Chanthaburi travel data model

All visitor-facing fields use `{ th, en, zh }`, so the client chooses the current
language without changing documents.  GeoJSON points use `[longitude, latitude]`.

Collections:

- `District`: the district list for the side navigation.
- `Place`: attractions under a district, including a short history and a Google Maps link.
- `Hotel`: independently managed accommodation records with a geospatial index.
- `TripCart`: a browser session's selected attractions, order, route distance/time, and hotel preference.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/travel/districts` | list sidebar districts |
| GET | `/api/travel/places?district=<id>` | list attractions for a district |
| GET | `/api/travel/hotels/nearby?lng=102.1&lat=12.6&radius=5000` | hotels within 5 km, nearest first |
| GET | `/api/travel/trip-carts/:sessionId` | retrieve a trip basket |
| POST | `/api/travel/trip-carts/:sessionId/items` | add `{ "placeId": "..." }` |
| DELETE | `/api/travel/trip-carts/:sessionId/items/:placeId` | remove an attraction |
| PATCH | `/api/travel/trip-carts/:sessionId/items/:placeId/route` | save `{ "distanceKm": 18.4, "durationMinutes": 27 }` |
| PATCH | `/api/travel/trip-carts/:sessionId` | update hotel search options |

`googleMapsUrl` should be populated with a Google Maps place/directions URL when
districts, attractions, and hotels are created. The web client can call Google
Directions API for each selected trip leg and save its returned distance and duration
to the route endpoint. This keeps API keys out of MongoDB and makes the displayed
route information refreshable.
