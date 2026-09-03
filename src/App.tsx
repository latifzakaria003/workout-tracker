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
import { History } from './pages/history';
import { ExerciseInfo } from './pages/exerciseInfo';
import { Profile } from './pages/profile';
import type { User } from 'firebase/auth';
import { OfflineBanner } from './components/offlineBanner';

function App() {

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <h1 className="loading">Loading...</h1>;

  return (
    <>
      <BrowserRouter>
        <OfflineBanner />
        <Routes>
          <Route path="/" element={user ? <Home /> : <Navigate to='/login' />}> </Route>
          <Route path="/login" element={!user ? <Login /> : <Navigate to='/' />}> </Route>
          <Route path="/signUp" element={<SignUp />}> </Route>
          <Route path="/editWorkout/:id?" element={user ? <EditWorkout /> : <Navigate to='/login' />}> </Route>
          <Route path="/workoutGeneration" element={user ? <WorkoutGeneration /> : <Navigate to='/login' />}> </Route>
          <Route path="/history/:date?" element={user ? <History /> : <Navigate to='/login' />}> </Route>
          <Route path="/exerciseInfo/:sourceId" element={user ? <ExerciseInfo /> : <Navigate to='/login' />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to='/login' />} />

          <Route path="*" element={<h1> Page not Found </h1>}> </Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
