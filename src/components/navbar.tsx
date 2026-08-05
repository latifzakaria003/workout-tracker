import { auth } from '../firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from 'firebase/auth';
import { Link } from 'react-router-dom';
import styles from './navbar.module.css';

export const Navbar = () => {
    const [user] = useAuthState(auth);

    const logOut = async () => {
        await signOut(auth);
    }

    return (
        <>
            <div className={styles.navbarAdjustment}>

                <div className={styles.userSection}>
                    <Link to="/" className={styles.links}>Home</Link>
                    {!user && <Link to="/login" className={styles.links}>Log In</Link>}
                </div>

                <div className={styles.userSection}>
                    <Link to="/" className={styles.links}>{user?.displayName}</Link>

                    {user ? <>
                        <div className={styles.userSection}>
                            <Link to="/history" className={styles.links}>History</Link>
                        </div>

                        <button
                            className={styles.logOutButton}
                            onClick={logOut}
                        >
                            Log Out
                        </button>
                    </>
                        :
                        (
                            <Link to="/" className={styles.links}>Profile</Link>
                        )}
                </div>


            </div>
        </>
    )


}