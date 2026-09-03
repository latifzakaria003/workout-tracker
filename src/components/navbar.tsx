import { auth } from '../firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from 'firebase/auth';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/sessionContext';
import styles from './navbar.module.css';

export const Navbar = () => {
    const [user, loading] = useAuthState(auth);
    const { clearSession } = useSession();
    const navigate = useNavigate();

    // cambio lo stile del link una volta premuto
    const linkClass = ({ isActive }: { isActive: boolean }) =>
        isActive ? `${styles.links} ${styles.active}` : styles.links;

    const logOut = async () => {
        try {
            clearSession();
            await signOut(auth);
            navigate("/login");
        } catch (err) {
            console.error(err);
        }
    };

    // nome dell'utente
    const profileLabel =
        user?.displayName || user?.email?.split("@")[0] || "Profile";

    return (
        <nav className={styles.navbarAdjustment}>

            <div className={styles.userSection}>
                <NavLink to="/" className={linkClass} end>Home</NavLink>

                {user && (
                    <NavLink to="/history" className={linkClass}>History</NavLink>
                )}
            </div>

            <div className={styles.userSection}>
                {!loading && !user && (
                    <NavLink to="/login" className={linkClass}>Log In</NavLink>
                )}

                {user && (
                    <>
                        <NavLink to="/profile" className={linkClass}>
                            {profileLabel}
                        </NavLink>

                        <button className={styles.logOutButton} onClick={logOut}>
                            Log Out
                        </button>
                    </>
                )}
            </div>

        </nav>
    );
};
