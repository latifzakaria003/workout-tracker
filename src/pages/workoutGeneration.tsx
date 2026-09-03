import { useEffect, useState } from 'react';
import { collection, doc, getDocs, query, setDoc, where, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase'
import { useAuthState } from 'react-firebase-hooks/auth';
import styles from './workoutGeneration.module.css';
import type { Goal, Exercises, Sets, WgerEquipment } from '../types';
import { generateWorkout, getSplit, GOAL_PARAMS } from '../assets/workoutGenerator';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/navbar';
import { useExercise } from "../contexts/exerciseContext";
import { useOnlineStatus } from '../assets/useOnlineStatus';

export const WorkoutGeneration = () => {

    const { exercises, loading } = useExercise();
    const [goal, setGoal] = useState<Goal>("strength");
    const [equipment, setEquipment] = useState<string[]>([]);
    const [userEquipment, setUserEquipment] = useState<string[]>(["none (bodyweight exercise)"]);
    const [sessionsDuration, setSessionsDuration] = useState(30);
    const [sessionsPerWeek, setSessionsPerWeek] = useState(1);
    const [name, setName] = useState("");
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState("");
    const online = useOnlineStatus();
    const [user] = useAuthState(auth);
    const navigate = useNavigate();

    const Generate = async () => {
        if (!user) return;

        setGenerating(true);
        setError("");

        try {
            // genero il workout
            const plans = generateWorkout(
                exercises,
                sessionsPerWeek,
                sessionsDuration,
                goal,
                userEquipment
            );
            // vado nella collezione workouts
            const workoutsRef = collection(db, "workouts");

            // calcolo il nuovo valore di cardOrder
            const maxQuery = query(
                workoutsRef,
                where("userId", "==", user.uid),
                orderBy("cardOrder", "desc"),
                limit(1)
            );
            const snap = await getDocs(maxQuery);
            const maxOrder = snap.empty ? 0 : (snap.docs[0].data().cardOrder ?? 0);
            let newCardOrder = maxOrder + 1;

            for (let i = 0; i < plans.length; i++) {
                const workoutDocRef = doc(workoutsRef); // creo un riferimento ad un nuovo workout
                const exercisesMap: Record<string, Exercises> = {};

                // metto gli esercizi su firestore
                plans[i].exercises.forEach((planned, order) => {
                    const exerciseId = doc(workoutsRef).id;
                    const sets: Record<string, Sets> = {};

                    for (let k = 0; k < planned.sets; k++)
                        sets[k] = { weight: 0, reps: planned.reps, completed: false };

                    exercisesMap[exerciseId] = {
                        docId: workoutDocRef.id,
                        id: exerciseId,
                        exerciseName: planned.exercise.name,
                        exerciseCategory: planned.exercise.category,
                        exerciseSourceId: planned.exercise.exerciseSourceId,
                        exerciseOrder: order,
                        imageUrl: planned.exercise.imageUrl,
                        muscleGroup: planned.exercise.muscleGroup,
                        rest: planned.isCardio ? 0 : GOAL_PARAMS[goal].rest,
                        sets,
                    };
                });
                await setDoc(workoutDocRef, {
                    name: `${name}: ${plans[i].split}`,
                    userId: user.uid,
                    automaticallyGenerated: true,
                    cardOrder: newCardOrder,
                    generationParameters: {
                        equipment: userEquipment,
                        goal: goal,
                        sessionDuration: sessionsDuration,
                        weeklySessions: sessionsPerWeek
                    },
                    exercises: exercisesMap
                });

                newCardOrder += 1;
            }
            navigate("/");
        } catch (err) {
            console.error(err);

            setError(
                online
                    ? "Something went wrong while saving. Please try again."
                    : "You're offline. Reconnect to generate a workout."
            );
        } finally {
            setGenerating(false);
        }
    };

    // prendo la lista di equipaggiamenti da wger
    const getEquipment = async () => {
        try {
            const response = await fetch("https://wger.de/api/v2/equipment/");

            if (!response.ok) throw new Error(`wger ${response.status}`);

            const data = await response.json();
            const result = data.results as WgerEquipment[];

            setEquipment(result.map((e) => e.name));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        getEquipment();
    }, []);

    const toggleEquipment = (value: string, checked: boolean) => {
        setUserEquipment(prev =>
            checked ? [...prev, value] : prev.filter(v => v !== value)
        );
    };

    return (
        <>
            <Navbar />
            <div className={styles.generatorContainer}>

                <div className={styles.section}>
                    <h2>Goal</h2>

                    <div className={styles.goalGrid}>
                        {([
                            ["strength", "Strength"],
                            ["hypertrophy", "Hypertrophy"],
                            ["endurance", "Endurance"],
                            ["weight loss", "Weight Loss"],
                            ["general fitness", "General Fitness"],
                        ] as [Goal, string][]).map(([value, label]) => (
                            <div className={styles.goalCard} key={value}>
                                <label>
                                    <input
                                        type="radio"
                                        name="goal"
                                        value={value}
                                        checked={goal === value}
                                        onChange={(e) => setGoal(e.target.value as Goal)}
                                    />
                                    {label}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.section}>
                    <h2>Equipment</h2>

                    <div className={styles.equipmentGrid}>
                        {equipment.map((eq) => (
                            <div className={styles.equipmentItem} key={eq}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={userEquipment.includes(eq)}
                                        onChange={(e) => toggleEquipment(eq, e.target.checked)}
                                    />
                                    {eq}
                                </label>
                            </div>
                        ))}

                        <div className={styles.equipmentItem}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={userEquipment.includes("gym")}
                                    onChange={(e) => toggleEquipment("gym", e.target.checked)}
                                />
                                Gym
                            </label>
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <h2>Training Settings</h2>

                    <div className={styles.settingsGrid}>
                        <div className={styles.setting}>
                            <label>Session Duration</label>
                            <select
                                value={sessionsDuration}
                                onChange={(e) => setSessionsDuration(Number(e.target.value))}
                            >
                                <option value={30}>30 min</option>
                                <option value={45}>45 min</option>
                                <option value={60}>60 min</option>
                                <option value={75}>75 min</option>
                                <option value={90}>90 min</option>
                                <option value={120}>120 min</option>
                            </select>
                        </div>

                        <div className={styles.setting}>
                            <label>Sessions Per Week</label>
                            <select
                                value={sessionsPerWeek}
                                onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
                            >
                                {[1, 2, 3, 4, 5, 6, 7].map(n => (
                                    <option value={n} key={n}>
                                        {n} {n === 1 ? "Session" : "Sessions"}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className={styles.summaryCard}>
                    <h2>Summary</h2>

                    <span><strong>Goal:</strong> {goal}</span>

                    <span>
                        <strong>Equipment:</strong>{" "}
                        {userEquipment.length > 0 ? userEquipment.join(", ") : "-"}
                    </span>

                    <span><strong>Duration:</strong> {sessionsDuration} min</span>

                    <span><strong>Sessions per week:</strong> {sessionsPerWeek}</span>

                    <span>
                        <strong>Split:</strong> {getSplit(sessionsPerWeek).join(" / ")}
                    </span>
                </div>

                <div className={styles.actions}>
                    <h3>Select a new name to continue..</h3>

                    <input
                        placeholder='name...'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    {error && <p className={styles.error}>{error}</p>}

                    {!online && (
                        <p className={styles.error}>
                            Generating a workout needs the exercise catalog from wger.
                            Reconnect to continue.
                        </p>
                    )}

                    <button
                        className={styles.generateBtn}
                        disabled={!online || loading || generating || name.trim() === ""}
                        onClick={Generate}
                    >
                        {!online
                            ? "Requires a connection"
                            : loading
                                ? "Loading exercises…"
                                : generating
                                    ? "Generating…"
                                    : "Generate Workout"}
                    </button>
                </div>

            </div>
        </>
    );
};
