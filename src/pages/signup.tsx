import { AuthForm } from '../components/authForm';
import { Navbar } from '../components/navbar';
import styles from '../components/authForm.module.css';

export const Signup = () => {

    return (
        <>
            <Navbar />
            <div className={styles.container}>
                <AuthForm mode={"signup"} />
            </div>
        </>

    );



}