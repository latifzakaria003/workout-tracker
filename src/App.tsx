
import './App.css'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Login } from './pages/login';
import { Home } from './pages/home';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/firebase'
import { SignUp } from './pages/signUp';
import { EditWorkout } from './pages/editWorkout';
import { WorkoutGeneration } from './pages/workoutGeneration';



function App() {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, [])

  if (loading) return <h1>Loading...</h1>;

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={user ? <Home /> : <Navigate to='/login' />}> </Route>
          <Route path="/login" element={!user ? <Login /> : <Navigate to='/' />}> </Route>
          <Route path="/signUp" element={<SignUp />}> </Route>
          <Route path="/editWorkout/:id?" element={user ? <EditWorkout /> : <Navigate to='/login' />}> </Route>
          <Route path="/workoutGeneration" element={user ? <WorkoutGeneration /> : <Navigate to='/login' />}> </Route>




          <Route path="*" element={<h1>Page not Found </h1>}> </Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
