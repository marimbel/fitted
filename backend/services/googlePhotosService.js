/**
 * services/googlePhotosService.js
 *
 * Wraps calls to the Google Photos Picker API. The Picker itself is a
 * frontend flow (the user picks photos in a Google-hosted UI widget);
 * this file is what the backend uses to fetch the actual photo bytes
 * once the frontend hands it a picker session / media item IDs.
 *
 * Docs to read before implementing: Google Photos Picker API —
 * https://developers.google.com/photos/picker/guides/get-started
 *
 * TODO: implement fetchPickedPhotos(). Rough shape: given media item
 * IDs from the frontend's picker session, call the Picker API's
 * mediaItems.get (or the session's returned base URLs) using the
 * user's access token, and return the image bytes/URLs for
 * geminiService.analyzeOutfitPhoto to consume.
 */
export async function fetchPickedPhotos(accessToken, mediaItemIds) {
  throw new Error("fetchPickedPhotos not implemented yet");
}
