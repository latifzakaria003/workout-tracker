import { auth, provider } from '../firebase/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { AuthFormProps } from '../types';
import styles from './authform.module.css';

// errori firebase 
const ERROR_MESSAGES: Record<string, string> = {
    "auth/invalid-email": "That email address is invalid.",
    "auth/invalid-credential": "Wrong email or password.",
    "auth/user-not-found": "Wrong email or password.",
    "auth/wrong-password": "Wrong email or password.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Try again in a few minutes.",
    "auth/network-request-failed": "No connection. Check your network and retry.",
    "auth/popup-blocked": "Your browser blocked the popup. Allow it and retry.",
};

export const AuthForm = ({ mode }: AuthFormProps) => {
    const isLogin = mode === "login"; // sto facendo login?

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const describeError = (err: unknown): string => {
        if (err instanceof FirebaseError) {
            return ERROR_MESSAGES[err.code] ?? "Something went wrong. Please try again.";
        }
        return "Something went wrong. Please try again.";
    };

    // controlli client-side
    const validate = (): string | null => {
        if (!email.trim()) return "Enter your email address.";
        if (!email.includes("@")) return "The email address is invalid.";
        if (!password) return "Enter your password.";
        if (!isLogin && password.length < 6) return "Password must be at least 6 characters.";
        return null;
    };

    // gestisco sign in/up normale
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (loading) return;

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setError("");
        setLoading(true);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email.trim(), password);
            } else {
                await createUserWithEmailAndPassword(auth, email.trim(), password);
            }
            navigate("/");
        } catch (err) {
            console.error(err);
            setError(describeError(err));
        } finally {
            setLoading(false);
        }
    };

    // gestisco sign in/up con google
    const signInWithGoogle = async () => {
        if (loading) return;

        setError("");
        setLoading(true);

        try {
            await signInWithPopup(auth, provider);
            navigate("/");
        } catch (err) {
            // se il popup viene chiuso non restituisco un errore
            if (err instanceof FirebaseError && err.code === "auth/popup-closed-by-user") {
                return;
            }
            console.error(err);
            setError(describeError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginCard}>
            <h1>Welcome</h1>
            <p className={styles.subtitle}>
                {isLogin ? "Sign in to continue" : "Sign up to continue"}
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
                <input
                    type="email"
                    placeholder="Email"
                    className={styles.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                    disabled={loading}
                />

                <div className={styles.passwordField}>
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        className={styles.input}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={isLogin ? "current-password" : "new-password"}
                        disabled={loading}
                    />
                    <button
                        type="button"
                        className={styles.revealButton}
                        onClick={() => setShowPassword(prev => !prev)}
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>
                </div>

                {!isLogin && !error && (
                    <p className={styles.hint}>At least 6 characters.</p>
                )}

                {error && (
                    <p className={styles.error} role="alert">{error}</p>
                )}

                <button
                    type="submit"
                    className={styles.signInButton}
                    disabled={loading}
                >
                    {loading
                        ? "Please wait…"
                        : isLogin ? "Sign In" : "Sign Up"}
                </button>
            </form>

            <div className={styles.divider}>
                <span>or</span>
            </div>

            <button
                type="button"
                className={styles.googleButton}
                onClick={signInWithGoogle}
                disabled={loading}
            >
                Continue with Google
            </button>

            <p className={styles.signupText}>
                {isLogin ? (
                    <>Don't have an account? <Link to="/signup">Sign up now</Link></>
                ) : (
                    <>Already have an account? <Link to="/login">Sign in</Link></>
                )}
            </p>
        </div>
    );
};
