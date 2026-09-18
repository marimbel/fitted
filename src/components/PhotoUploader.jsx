import { useRef } from "react";

/**
 * PhotoUploader.jsx
 *
 * Lets the user pick an image from their own computer and shows a live
 * preview of it. The photo itself is never uploaded anywhere — it's read
 * entirely in the browser using the FileReader API and stored as a data
 * URL string in the parent App component's state (lifted state, same
 * pattern as selectedProduct and favorites).
 *
 * `useRef` here holds a reference to the hidden <input type="file">
 * DOM node so the visible "Choose Photo" button can trigger it
 * programmatically — this is a common React pattern for styling native
 * file inputs, which are otherwise very hard to customize with CSS.
 *
 * Props:
 *   photo          - data URL string of the uploaded photo, or null
 *   onPhotoSelected - (dataUrl: string) => void
 */
export default function PhotoUploader({ photo, onPhotoSelected }) {
  const fileInputRef = useRef(null);

  function handleChooseClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    // FileReader converts the local file into a base64 data URL that an
    // <img> tag can render directly, with no server involved.
    const reader = new FileReader();
    reader.onload = () => {
      onPhotoSelected(reader.result);
    };
    reader.readAsDataURL(file);
  }

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

      <button type="button" className="btn-fitted btn-dark w-100" onClick={handleChooseClick}>
        Choose Photo
      </button>
    </div>
  );
}
