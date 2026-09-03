import { Navbar } from '../components/navbar';
import styles from './home.module.css';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import type { Workout, WorkoutCardProps } from '../types'
import { WorkoutCard } from '../components/workoutCard';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';

export const Home = () => {

    const navigate = useNavigate();

    const [workouts, setWorkouts] = useState<WorkoutCardProps[]>([]);   // lista di workout
    const [user] = useAuthState(auth);
    const [loading, setLoading] = useState(true);

    // prendo i workout da Firestore
    const getWorkout = async () => {
        if (!user) return;

        try {
            // prendo i workouts dell'utente
            const snapshot = await getDocs(query(
                collection(db, "workouts"),
                where("userId", "==", user.uid)
            ));

            // metto i workouts in una lista
            const workoutList: WorkoutCardProps[] = [];
            snapshot.forEach((doc) => {
                const workout = doc.data() as Workout;
                const exercises = Object.values(workout.exercises ?? {});

                // calcolo volume totale
                let volume = 0;
                exercises.forEach((exercise) => {
                    Object.values(exercise.sets ?? {}).forEach((set) => {
                        const weight = (set.weight === 0) ? 1 : set.weight;
                        volume += weight * set.reps;
                    });
                });

                workoutList.push({
                    id: doc.id,
                    name: workout.name,
                    exerciseCount: exercises.length,
                    volume: volume,
                    cardOrder: workout.cardOrder,
                    onUpdate: () => { }
                });
            });

            workoutList.sort((a, b) => a.cardOrder - b.cardOrder);  // ordino
            setWorkouts(workoutList);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getWorkout();
    }, [user]);


    return (

        <>
            <Navbar />
            <div className={styles.container}>
                <h1 className={styles.title}>Home</h1>

                <div className={styles.buttonsContainer}>
                    <button
                        className={styles.workoutButton}
                        onClick={() => navigate("/editWorkout")}
                    >
                        Add Workout
                    </button>

                    <button
                        className={styles.workoutButton}
                        onClick={() => navigate("/workoutGeneration")}
                    >
                        Generate Workout
                    </button>
                </div>
            </div>
            <div className={styles.workoutList}>


                {loading ?
                    <p className={styles.state}>Loading…</p>
                    :
                    workouts.map((workout, index) => (
                        <WorkoutCard
                            key={workout.id}
                            id={workout.id}
                            cardOrder={index}
                            name={workout.name}
                            exerciseCount={workout.exerciseCount}
                            volume={workout.volume}
                            onUpdate={getWorkout}
                        />
                    ))}
            </div>
        </>
    );
};
