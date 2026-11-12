import { useRef } from "react";
import { trackEvent } from "../services/analytics.js";

/**
 * PhotoUploader.jsx
 *
 * Lets the user pick an image from their own computer and shows a live
 * preview of it. The photo itself is never uploaded anywhere for the
 * local-file path — it's read entirely in the browser using the
 * FileReader API and stored as a data URL string in the parent App
 * component's state (lifted state, same pattern as selectedProduct and
 * favorites).
 *
 * `useRef` here holds a reference to the hidden <input type="file">
 * DOM node so the visible "Choose Photo" button can trigger it
 * programmatically — this is a common React pattern for styling native
 * file inputs, which are otherwise very hard to customize with CSS.
 *
 * Props:
 *   photo          - data URL string of the uploaded (FRONT) photo, or null
 *   onPhotoSelected - (dataUrl: string) => void
 *   onImportFromGooglePhotos - optional () => void. When provided, a
 *     second button offers to import a photo from Google Photos instead
 *     of the local filesystem (Project 2's SocialNetwork X source —
 *     see hooks/useGooglePhotosPicker.js). Omitting this prop keeps the
 *     component working exactly as it did in Project 1.
 *   googlePhotosStatus - optional status string from that hook, shown
 *     as a small loading note while a picker session is in progress.
 *   sidePhoto / backPhoto, onSidePhotoSelected / onBackPhotoSelected -
 *     optional. When BOTH a photo's value and its setter are passed,
 *     a small secondary upload slot renders for that angle. Real
 *     Virtual Try-On (services/virtualTryOnService.js on the backend)
 *     can't invent a side/back view from one front photo -- it only
 *     redresses whatever pose is already in the photo you give it --
 *     so a genuine multi-angle result means the user supplying a real
 *     photo FROM that angle. Omitting these two props (e.g. if a
 *     future caller doesn't need multi-angle) keeps this component
 *     working exactly as it did before they existed.
 */
export default function PhotoUploader({
  photo,
  onPhotoSelected,
  onImportFromGooglePhotos,
  googlePhotosStatus,
  sidePhoto,
  onSidePhotoSelected,
  backPhoto,
  onBackPhotoSelected,
}) {
  const fileInputRef = useRef(null);
  const sideInputRef = useRef(null);
  const backInputRef = useRef(null);

  function readFileAsDataUrl(file, onLoaded, label) {
    // FileReader converts the local file into a base64 data URL that an
    // <img> tag can render directly, with no server involved. Shared by
    // the main photo and both optional angle slots below.
    const reader = new FileReader();
    reader.onload = () => {
      onLoaded(reader.result);
      trackEvent({ category: "Engagement", action: "Uploaded Photo", label });
    };
    reader.readAsDataURL(file);
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (file) readFileAsDataUrl(file, onPhotoSelected, "Front");
  }

  function handleSideFileChange(event) {
    const file = event.target.files?.[0];
    if (file) readFileAsDataUrl(file, onSidePhotoSelected, "Side");
  }

  function handleBackFileChange(event) {
    const file = event.target.files?.[0];
    if (file) readFileAsDataUrl(file, onBackPhotoSelected, "Back");
  }

  const importBusy = googlePhotosStatus && !["idle", "done", "error"].includes(googlePhotosStatus);
  const showAngleSlots = Boolean(onSidePhotoSelected && onBackPhotoSelected);

  return (
    <div className="photo-uploader">
      <div className="photo-uploader-preview">
        {photo ? (
          <img src={photo} alt="Your uploaded photo" />
        ) : (
          <div className="photo-uploader-placeholder">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 16.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2.5" />
              <path d="M12 15V4" />
              <path d="M7 8l5-5 5 5" />
            </svg>
            <p>Upload your photo</p>
          </div>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="d-none"
        aria-hidden="true"
      />

      <button type="button" className="btn-fitted btn-dark w-100" onClick={() => fileInputRef.current?.click()}>
        Choose Photo
      </button>

      {onImportFromGooglePhotos && (
        <>
          <button
            type="button"
            className="btn-fitted btn-outline w-100 mt-2"
            onClick={onImportFromGooglePhotos}
            disabled={importBusy}
          >
            {importBusy ? "Importing from Google Photos…" : "Import from Google Photos"}
          </button>
          {googlePhotosStatus === "error" && (
            <p className="style-request-error mt-1">Couldn't import from Google Photos. Try again.</p>
          )}
        </>
      )}

      {/* Optional side/back angle photos -- only for a genuinely real
          multi-angle try-on result (see the component doc comment
          above). Neither slot is required; try-on still works with
          just the front photo. */}
      {showAngleSlots && (
        <div className="photo-angle-slots">
          <p className="photo-angle-slots-label">
            Add more angles for a real multi-angle try-on (optional):
          </p>
          <div className="photo-angle-slot-row">
            <div className="photo-angle-slot">
              <div className="photo-angle-thumb">{sidePhoto && <img src={sidePhoto} alt="Your side-angle photo" />}</div>
              <input type="file" accept="image/*" ref={sideInputRef} onChange={handleSideFileChange} className="d-none" aria-hidden="true" />
              <button type="button" className="btn-fitted btn-outline btn-sm w-100" onClick={() => sideInputRef.current?.click()}>
                {sidePhoto ? "Change Side" : "Add Side"}
              </button>
            </div>
            <div className="photo-angle-slot">
              <div className="photo-angle-thumb">{backPhoto && <img src={backPhoto} alt="Your back-angle photo" />}</div>
              <input type="file" accept="image/*" ref={backInputRef} onChange={handleBackFileChange} className="d-none" aria-hidden="true" />
              <button type="button" className="btn-fitted btn-outline btn-sm w-100" onClick={() => backInputRef.current?.click()}>
                {backPhoto ? "Change Back" : "Add Back"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
