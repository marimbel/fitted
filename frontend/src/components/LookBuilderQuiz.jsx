import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../styles/look-builder-quiz.css";

const styles = {
  minimalist: { label: "Minimalist", image: "minimalist.jpg" },
  streetwear: { label: "Streetwear", image: "streetwear.jpg" },
  "coastal-minimalism": { label: "Coastal Minimalism", image: "coastal-minimalism.webp" },
  tailored: { label: "Tailored", image: "tailored.webp" },
  "quiet-luxury": { label: "Quiet Luxury", image: "quiet-luxury.jpg" },
  edgy: { label: "Edgy", image: "edgy.jpg" },
  romantic: { label: "Romantic", image: "romantic.jpg" },
  bohemian: { label: "Bohemian", image: "bohemian.jpg" },
  classic: { label: "Classic", image: "classic.jpg" },
  "avant-garde": { label: "Avant-Garde", image: "avant-garde.webp" },
};
const pairs = [
  ["minimalist", "streetwear"],
  ["coastal-minimalism", "tailored"],
  ["quiet-luxury", "edgy"],
  ["romantic", "bohemian"],
  ["classic", "avant-garde"],
];

export default function LookBuilderQuiz({ onClose, onComplete }) {
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const complete = step === pairs.length;

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => { headingRef.current?.focus(); }, [step]);

  function choose(slug) {
    setAnswers((current) => {
      const next = [...current];
      next[step] = slug;
      return next;
    });
    setStep((current) => current + 1);
  }

  return createPortal(
    <dialog ref={dialogRef} className="look-builder-quiz" aria-labelledby="look-builder-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className="look-builder-quiz-header">
        <div><span className="voice-style-eyebrow">A little inspiration, chosen by you</span><h2 id="look-builder-title">LookBuilder</h2></div>
        <button type="button" className="btn-fitted btn-outline" onClick={onClose} aria-label="Close LookBuilder quiz">×</button>
      </div>
      <p role="status">{complete ? "Your selections are ready" : `Pair ${step + 1} of ${pairs.length}`}</p>
      <progress value={step} max={pairs.length} aria-label="Quiz progress" />
      <h3 ref={headingRef} tabIndex={-1}>{complete ? "Your style selections" : "Which look feels more like you?"}</h3>
      {complete ? <>
        <p>These are your choices from each pair, rather than a single style label. Finish to keep them in this fitting-room session.</p>
        <ul className="look-builder-summary">
          {answers.map((slug, index) => <li key={index}>{styles[slug].label}</li>)}
        </ul>
        <div className="look-builder-quiz-actions">
          <button type="button" className="btn-fitted btn-outline" onClick={() => setStep(pairs.length - 1)}>Back</button>
          <button type="button" className="btn-fitted btn-outline" onClick={() => { setAnswers([]); setStep(0); }}>Start over</button>
          <button type="button" className="btn-fitted btn-dark" onClick={() => onComplete(answers.map((slug, index) => ({
            preferred: slug,
            label: styles[slug].label,
            alternative: pairs[index].find((item) => item !== slug),
          })))}>Finish quiz</button>
        </div>
      </> : <>
        <p>Choose the outfit you would rather wear. There are no wrong answers.</p>
        <div className="look-builder-pair">
          {pairs[step].map((slug) => <button type="button" className="look-builder-choice" key={slug}
            aria-pressed={answers[step] === slug} onClick={() => choose(slug)}>
            <img src={`/images/inspiration/${styles[slug].image}`} alt={`${styles[slug].label} outfit inspiration`} />
            <span>{styles[slug].label}</span><small>Choose this look →</small>
          </button>)}
        </div>
        <div className="look-builder-quiz-actions">
          <button type="button" className="btn-fitted btn-outline" disabled={step === 0} onClick={() => setStep((current) => current - 1)}>Back</button>
          <span>Your choices are kept when you go back.</span>
        </div>
      </>}
    </dialog>, document.body
  );
}
