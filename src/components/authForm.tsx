import { auth, provider } from '../firebase/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { AuthFormProps } from '../types';
import styles from './authform.module.css'

export const AuthForm = ({ mode }: AuthFormProps) => {

    const islogin = (mode === "login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(auth, provider);

            navigate("/");
        } catch (err) {
            console.error(err);
        }
    }

    const signIn = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            console.error(err);
        }
    }

    const signUp = async () => {
        try {
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            navigate("/");
        } catch (err) {
            console.log(err);
        }
    };



    return (
        <div className={styles.loginCard}>

            <h1>Welcome</h1>
            <p className={styles.subtitle}>
                {islogin ? "Sign in to continue" : "Sign up to continue"}
            </p>

            <input
                type="email"
                placeholder="Email"
                className={styles.input}
                onChange={(e) => setEmail(e.target.value)}
            />

            <input
                type="password"
                placeholder="Password"
                className={styles.input}
                onChange={(e) => setPassword(e.target.value)}
            />
            {
                islogin ? (
                    <button className={styles.signInButton} onClick={signIn}>
                        Sign In
                    </button>)
                    :
                    (
                        <button className={styles.signInButton} onClick={signUp}>
                            Sign Up
                        </button>
                    )
            }
            <div className={styles.divider}>
                <span>or</span>
            </div>

            <button
                className={styles.googleButton}
                onClick={signInWithGoogle}
            >
                Continue with Google
            </button>
            {islogin &&
                <p className={styles.signupText}>
                    Don't have an account?
                    <span onClick={() => navigate("/signup")}> Sign up now</span>
                </p>
            }
        </div>
    )

} 