import { AuthForm } from '../components/authForm';
import { Navbar } from '../components/navbar';
import styles from '../components/authForm.module.css';

export const Login = () => {
    return (
        <>
            <Navbar />
            <div className={styles.container}>
                <AuthForm mode={"login"} />
            </div>
        </>
    );
}

