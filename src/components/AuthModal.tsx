import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "../api/client";
import { GoogleSignInButton } from "./GoogleSignInButton";
import styles from "./AuthModal.module.css";

type Mode = "login" | "register";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onRegister: (body: {
    email: string;
    username: string;
    password: string;
  }) => Promise<void>;
  onLogin: (body: { email: string; password: string }) => Promise<void>;
  onGoogle: (credential: string) => Promise<void>;
}

export function AuthModal({
  open,
  onClose,
  onRegister,
  onLogin,
  onGoogle,
}: AuthModalProps) {
  const [mode, setMode] = useState<Mode>("register");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setError(null);
      setPassword("");
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "register") {
        await onRegister({ email, username, password });
      } else {
        await onLogin({ email, password });
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Une erreur est survenue."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={mode === "register" ? "Inscription" : "Connexion"}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.close} onClick={onClose} aria-label="Fermer">
          ✕
        </button>

        <h2 className={styles.title}>
          {mode === "register" ? "Inscris-toi" : "Connecte-toi"}
        </h2>
        <p className={styles.subtitle}>
          {mode === "register"
            ? "Crée ton compte pour acheter et vendre."
            : "Ravi de te revoir sur ShopTaSapp."}
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            E-mail
            <input
              className={styles.input}
              type="email"
              value={email}
              required
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          {mode === "register" && (
            <label className={styles.label}>
              Nom d'utilisateur
              <input
                className={styles.input}
                type="text"
                value={username}
                required
                autoComplete="username"
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>
          )}

          <label className={styles.label}>
            Mot de passe
            <input
              className={styles.input}
              type="password"
              value={password}
              required
              minLength={6}
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.submit} type="submit" disabled={submitting}>
            {submitting
              ? "Veuillez patienter…"
              : mode === "register"
                ? "Créer mon compte"
                : "Se connecter"}
          </button>
        </form>

        <div className={styles.divider}>
          <span>ou</span>
        </div>

        <GoogleSignInButton
          onCredential={async (credential) => {
            setError(null);
            try {
              await onGoogle(credential);
              onClose();
            } catch (err) {
              setError(
                err instanceof ApiError
                  ? err.message
                  : "Connexion Google impossible."
              );
            }
          }}
        />

        <p className={styles.switch}>
          {mode === "register" ? "Déjà un compte ? " : "Pas encore inscrit ? "}
          <button
            type="button"
            className={styles.switchBtn}
            onClick={() => {
              setMode(mode === "register" ? "login" : "register");
              setError(null);
            }}
          >
            {mode === "register" ? "Se connecter" : "S'inscrire"}
          </button>
        </p>
      </div>
    </div>
  );
}
