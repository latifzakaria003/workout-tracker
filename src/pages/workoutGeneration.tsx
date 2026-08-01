import { useEffect, useState } from 'react';
import { addDoc, collection, doc, getCountFromServer } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase'
import { useAuthState } from 'react-firebase-hooks/auth';
import styles from './workoutGeneration.module.css';
import type { Goal, Exercises, Sets, WgerEquipment } from '../types';
import { GenerateWorkout, getSplit } from '../functions/workoutGenerator';
import { GOAL_PARAMS } from '../functions/workoutGenerator';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/navbar';
import { useExercises } from "../hooks/useExercises";



export const WorkoutGeneration = () => {

    const { exercises, loading } = useExercises();
    const [goal, setGoal] = useState<Goal>("strength");
    const [equipment, setEquipment] = useState<string[]>([]);
    const [userEquipment, setUserEquipment] = useState<string[]>(["none (bodyweight exercise)"]);
    const [sessionsDuration, setSessionsDuration] = useState(30);
    const [sessionsPerWeek, setSessionsPerWeek] = useState(1);
    const [name, setName] = useState("");
    const [user] = useAuthState(auth);
    const navigate = useNavigate();

    const Generate = async () => {
        while (loading) { ; }
        const workout = GenerateWorkout(exercises, sessionsPerWeek, sessionsDuration, goal, userEquipment);

        const workoutRef = collection(db, "workouts");
        const snapshot = await getCountFromServer(workoutRef);

        let cardOrder = snapshot.data().count;
        for (let i = 0; i < workout.length; i++) {
            const exercisesMap: Record<string, Exercises> = {};
            const sets: Record<string, Sets> = {}
            for (let j = 0; j < workout[i].sets; j++) {
                sets[j] = { weight: 0, reps: GOAL_PARAMS[goal].reps[0] }
            }
            for (let j = 0; j < workout[i].workout.length; j++) {
                const exerciseId = doc(collection(db, "workouts")).id;

                exercisesMap[exerciseId] = {
                    docId: workoutRef.id,
                    id: exerciseId,
                    exerciseName: workout[i].workout[j].name,
                    exerciseSourceId: workout[i].workout[j].exerciseSourceId,
                    exerciseOrder: j,
                    imageUrl: workout[i].workout[j].imageUrl,
                    muscleGroup: workout[i].workout[j].muscleGroup,
                    rest: GOAL_PARAMS[goal].rest,
                    sets: sets
                }
            };

            await addDoc(workoutRef, {
                name: name + `: ${getSplit(sessionsPerWeek)[i]}`,
                userId: user?.uid,
                automaticallyGenerated: true,
                cardOrder: cardOrder,
                generationParameters: {
                    equipment: userEquipment,
                    goal,
                    sessionDuration: sessionsDuration,
                    weeklySessions: sessionsPerWeek
                },
                exercises: exercisesMap
            });
            cardOrder += 1;
        }
        navigate("/");
    }





    const getEquipment = async () => {
        try {
            const response = await fetch(
                "https://wger.de/api/v2/equipment/"
            );
            const data = await response.json();
            const result = data.results as WgerEquipment[];

            setEquipment(result.map((e) => e.name));

        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        getEquipment();
    }, [])



    return (
        <>
            <Navbar />
            <div className={styles.generatorContainer}>

                <div className={styles.section}>
                    <h2>Goal</h2>

                    <div className={styles.goalGrid}>

                        <div className={styles.goalCard}>
                            <label>
                                <input
                                    type="radio"
                                    name="goal"
                                    value="strength"
                                    checked={goal === "strength"}
                                    onChange={(e) => setGoal(e.target.value as Goal)}
                                />
                                Strength
                            </label>
                        </div>

                        <div className={styles.goalCard}>
                            <label>
                                <input
                                    type="radio"
                                    name="goal"
                                    value="hypertrophy"
                                    checked={goal === "hypertrophy"}
                                    onChange={(e) => setGoal(e.target.value as Goal)}
                                />
                                Hypertrophy
                            </label>
                        </div>

                        <div className={styles.goalCard}>
                            <label>
                                <input
                                    type="radio"
                                    name="goal"
                                    value="endurance"
                                    checked={goal === "endurance"}
                                    onChange={(e) => setGoal(e.target.value as Goal)}
                                />
                                Endurance
                            </label>
                        </div>

                        <div className={styles.goalCard}>
                            <label>
                                <input
                                    type="radio"
                                    name="goal"
                                    value="weight loss"
                                    checked={goal === "weight loss"}
                                    onChange={(e) => setGoal(e.target.value as Goal)}
                                />
                                Weight Loss
                            </label>
                        </div>

                        <div className={styles.goalCard}>
                            <label>
                                <input
                                    type="radio"
                                    name="goal"
                                    value="general fitness"
                                    checked={goal === "general fitness"}
                                    onChange={(e) => setGoal(e.target.value as Goal)}
                                />
                                General Fitness
                            </label>
                        </div>

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
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setUserEquipment([...userEquipment, eq]);
                                            } else {
                                                setUserEquipment(
                                                    userEquipment.filter(v => v !== eq)
                                                );
                                            }
                                        }}
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
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setUserEquipment([...userEquipment, "gym"]);
                                        } else {
                                            setUserEquipment(
                                                userEquipment.filter(v => v !== "gym")
                                            );
                                        }
                                    }}
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
                                onChange={(e) =>
                                    setSessionsDuration(Number(e.target.value))
                                }
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
                                onChange={(e) =>
                                    setSessionsPerWeek(Number(e.target.value))
                                }
                            >
                                <option value={1}>1 Session</option>
                                <option value={2}>2 Sessions</option>
                                <option value={3}>3 Sessions</option>
                                <option value={4}>4 Sessions</option>
                                <option value={5}>5 Sessions</option>
                                <option value={6}>6 Sessions</option>
                                <option value={7}>7 Sessions</option>
                            </select>
                        </div>

                    </div>
                </div>

                <div className={styles.summaryCard}>
                    <h2>Summary</h2>

                    <span>
                        <strong>Goal:</strong> {goal || "-"}
                    </span>

                    <span>
                        <strong>Equipment:</strong>{" "}
                        {userEquipment.length > 0
                            ? userEquipment.join(", ")
                            : "-"}
                    </span>

                    <span>
                        <strong>Duration:</strong>{" "}
                        {sessionsDuration > 0
                            ? `${sessionsDuration} min`
                            : "-"}
                    </span>

                    <span>
                        <strong>Sessions per week:</strong>{" "}
                        {sessionsPerWeek > 0
                            ? sessionsPerWeek
                            : "-"}
                    </span>
                </div>

                <div className={styles.actions}>
                    <h3>Select a new name to continue..</h3>
                    <input
                        placeholder='name...'
                        onChange={(e) => setName(e.target.value)}
                    />
                    <button
                        className={styles.generateBtn}
                        disabled={name.trim() === ""}
                        onClick={Generate}
                    >
                        Generate Workout
                    </button>
                </div>

            </div>
        </>

    )
}