import { useEffect, useRef } from "react";
import { api } from "../api/client";

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
}

let scriptPromise: Promise<void> | null = null;

function loadGsi(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Échec du chargement de Google."));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export function GoogleSignInButton({ onCredential }: GoogleSignInButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Garde la dernière fonction de rappel sans relancer l'effet d'initialisation.
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const cfg = await api.googleConfig();
        if (cancelled || !cfg.enabled || !cfg.clientId) return;

        await loadGsi();
        // Attend que le conteneur soit monté dans le DOM.
        if (cancelled || !ref.current || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: cfg.clientId,
          callback: (response: { credential: string }) => {
            callbackRef.current(response.credential);
          },
        });
        window.google.accounts.id.renderButton(ref.current, {
          theme: "outline",
          size: "large",
          width: 320,
          text: "continue_with",
          locale: "fr",
        });
      } catch {
        /* Google indisponible — on n'affiche rien. */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Le conteneur est TOUJOURS rendu pour que la ref existe au moment du rendu du bouton.
  return <div ref={ref} style={{ display: "flex", justifyContent: "center" }} />;
}
