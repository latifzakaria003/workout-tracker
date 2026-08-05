import { Navbar } from '../components/navbar';
import styles from './home.module.css';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import type { Workout, WorkoutCardProps } from '../types'
import { WorkoutCard } from '../components/workoutCard';
import { useNavigate } from 'react-router-dom';

export const Home = () => {

    const navigate = useNavigate();

    const [workouts, setWorkouts] = useState<WorkoutCardProps[]>([]);

    const getWorkout = async () => {
        try {
            const snapshot = await getDocs(collection(db, "workouts"));

            const workoutList: WorkoutCardProps[] = [];

            snapshot.forEach((doc) => {

                const workout = doc.data() as Workout;

                const exercises = Object.values(workout.exercises);

                let volume = 0;

                exercises.forEach((exercise) => {

                    Object.values(exercise.sets).forEach((set) => {
                        const weight = (set.weight == 0) ? 1 : set.weight;
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
            workoutList.sort((a, b) => a.cardOrder - b.cardOrder);
            setWorkouts(workoutList);
            getWorkout();
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        getWorkout();
    }, []);

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
            <div>
                {workouts.map((workout, index) => (
                    <>
                        <br></br>
                        <WorkoutCard
                            id={workout.id}
                            cardOrder={index}
                            name={workout.name}
                            exerciseCount={workout.exerciseCount}
                            volume={workout.volume}
                            onUpdate={getWorkout}

                        />
                    </>
                ))}
            </div>
        </>
    );
};
