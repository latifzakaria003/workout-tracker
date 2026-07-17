
import { auth, provider } from '../firebase/firebase';
import { signInWithPopup, } from 'firebase/auth'
import { useNavigate } from 'react-router-dom';


export const Login = () => {

    const navigate = useNavigate();

    const signInWithGoogle = async () => {
        const result = await signInWithPopup(auth, provider); // result contains the info of the account used to sing in 
        navigate("/");
    }



    return (
        <>
            <h1>Login Page</h1>
            <div>
                <p>Sign up to continue</p>
                <button onClick={signInWithGoogle}>Sign up with Google</button> <button>Sign up with Email</button>
                <br></br>
                <button>Log in</button>
            </div>

        </>

    );



}

