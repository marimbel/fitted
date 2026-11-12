import GoogleSignInButton from "../components/GoogleSignInButton.jsx";
import { useGooglePhotosPicker } from "../hooks/useGooglePhotosPicker.js";

/**
 * GooglePhotosPage.jsx
 *
 * A dedicated SPA tab for importing and managing Google Photos, kept
 * separate from the Fitting Room's own photo upload (which is for a
 * single local file). Every photo imported here gets analyzed by
 * Gemini (see backend/routes/photos.js) and is available both to the
 * "Get AI Style Recommendations" flow back on the Fitting Room page
 * and, by clicking one, as the Fitting Room Stage's active photo.
 *
 * `photoAnalyses` is lifted to App.jsx (not local state here) so it
 * survives navigating away to another tab and back, and so the Fitting
 * Room's "Generate Looks" button can see the same imported photos.
 *
 * Props:
 *   auth            - the shared useGoogleAuth() object (from App.jsx)
 *   photoAnalyses   - every photo imported so far, each analyzed by Gemini
 *   onAnalysesAdded - (newAnalyses: array) => void, appends to the above
 *   activePhoto     - the Fitting Room Stage's current photo (data URL), or null
 *   onPhotoSelected - (dataUrl: string) => void, sets the Stage's active photo
 */
export default function GooglePhotosPage({ auth, photoAnalyses, onAnalysesAdded, activePhoto, onPhotoSelected }) {
  const photosPicker = useGooglePhotosPicker({ idToken: auth.idToken, accessToken: auth.accessToken });
  const importBusy = !["idle", "done", "error"].includes(photosPicker.status);

  async function handleImport() {
    const newAnalyses = await photosPicker.pickPhotos();
    if (newAnalyses?.length) onAnalysesAdded(newAnalyses);
  }

  function toDataUrl(analysis) {
    return `data:${analysis.mimeType};base64,${analysis.previewBase64}`;
  }

  return (
    <div>
      <div className="fitting-room-heading">
        <h1>Google Photos</h1>
        <p>Bring in photos from your Google Photos library -- each one gets analyzed by Gemini and can be used in the Fitting Room or for AI style recommendations.</p>
      </div>

      {!auth.isSignedIn ? (
        <div className="google-photos-empty">
          <p>Sign in with Google to import photos from your library.</p>
          <GoogleSignInButton auth={auth} />
        </div>
      ) : (
        <>
          <div className="google-photos-toolbar">
            <GoogleSignInButton auth={auth} />
            {auth.accessToken ? (
              <button type="button" className="btn-fitted btn-dark" onClick={handleImport} disabled={importBusy}>
                {importBusy ? "Importing…" : "Import from Google Photos"}
              </button>
            ) : (
              <button type="button" className="btn-fitted btn-outline" onClick={auth.requestPhotosAccess}>
                Grant Google Photos access
              </button>
            )}
          </div>

          {photosPicker.status === "error" && (
            <p className="style-request-error">
              {photosPicker.error === "Timed out waiting for a photo to be picked."
                ? "No photo was picked in time -- this usually means the Google Photos library for this account is empty, or the picker window was closed before anything was selected. You can also just upload a photo directly in the Fitting Room."
                : photosPicker.error || "Couldn't import from Google Photos. Try again."}
            </p>
          )}

          {photoAnalyses.length === 0 ? (
            <div className="google-photos-empty">
              <p>No photos imported yet.</p>
              <p>Click "Import from Google Photos" above to bring one in.</p>
            </div>
          ) : (
            <div className="google-photos-grid">
              {photoAnalyses.map((analysis, index) => {
                const dataUrl = toDataUrl(analysis);
                return (
                  <button
                    key={analysis.id || index}
                    type="button"
                    className={`google-photo-thumb${activePhoto === dataUrl ? " is-active" : ""}`}
                    onClick={() => onPhotoSelected(dataUrl)}
                  >
                    <div className="google-photo-thumb-media">
                      <img src={dataUrl} alt="Imported from Google Photos" />
                    </div>
                    <p className="google-photo-thumb-caption">
                      {analysis.garments?.length ? analysis.garments.join(", ") : "Analyzed photo"}
                    </p>
                    {activePhoto === dataUrl && <span className="google-photo-thumb-badge">In use</span>}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
