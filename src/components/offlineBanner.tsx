import { useOnlineStatus } from '../assets/useOnlineStatus';
import styles from './offlineBanner.module.css';

// SEGNALA ALL'UTENTE CHE E' OFFLINE
export const OfflineBanner = () => {
    const online = useOnlineStatus();

    if (online) return null;

    return (
        <div className={styles.banner} role="status">
            <span className={styles.dot} aria-hidden="true" />
            You're offline — your workouts are saved on this device and will
            sync when you're back online.
        </div>
    );
};