import { auth } from '../firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from 'firebase/auth';
import { Link } from 'react-router-dom';

export const Navbar = () => {
    const [user] = useAuthState(auth);

    const logOut = async () => {
        await signOut(auth);
    }


    return (
        <>
            <div>
                <Link to={"/"}> Home </Link>
            </div>
            <div>
                <Link to={"/login"}> Log In </Link>

                <p>{user?.displayName}</p>
                <button onClick={logOut} >Log Out</button>
            </div>
        </>
    )


}