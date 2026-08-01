import { useState } from 'react';
import type { ExerciseSelectorProps } from '../types';
import { SelectorCard } from './selectorCard';
import styles from './exerciseSelector.module.css';
import { useExercises } from '../hooks/useExercises';

export const ExerciseSelector = ({ documentId, onClose }: ExerciseSelectorProps) => {


    // aggiungere filtri
    const equipmentList = ["Barbell", "Bench", "Cable machine", "Dumbbell", "Gym mat", "Incline bench", "Kettlebell", "Pull-up bar", "Resistance band", "SZ-Bar", "Swiss Ball"
        , "none (bodyweight exercise)"
    ]
    const [search, setSearch] = useState("")
    const [isClosed, setIsClosed] = useState(false);
    const { exercises, loading } = useExercises();
    const [showFilters, setShowFilters] = useState(false);
    const [muscle, setMuscle] = useState("");
    const [equipment, setEquipment] = useState<string[]>([]);

    exercises.map((exercise) => exercise.docId = documentId);

    // mostro solo 10 esercizi
    let filteredExercises = exercises
        .filter((exercise) => {
            // ricerca per nome
            if (
                !exercise.name
                    .toLowerCase()
                    .includes(search.toLowerCase())
            ) {
                return false;
            }

            // filtro muscolo
            if (
                muscle &&
                exercise.muscleGroup !== muscle &&
                !exercise.secondaryMuscleGroup.includes(muscle)
            ) {
                return false;
            }

            // filtro attrezzatura
            if (
                equipment.length > 0 &&
                !exercise.equipment.some(eq => equipment.includes(eq))
            ) {
                return false;
            }

            return true;
        });
    if ((!muscle) && (equipment.length == 0)) {
        filteredExercises = filteredExercises.slice(0, 10);
    }



    if (loading) {
        return <div className={styles.loader}>
            Loading exercises...
        </div>
    }


    return (

        <>
            <div className={styles.container}>
                <div className={styles.modal}>
                    <input
                        className={styles.searchInput}
                        type="text"
                        placeholder="Search exercise..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setIsClosed(false); }}
                    />
                    {showFilters && <><select
                        value={muscle}
                        onChange={(e) => setMuscle(e.target.value)}
                    >
                        <option value="">All muscles</option>
                        <option value="Chest">Chest</option>
                        <option value="Back">Back</option>
                        <option value="Legs">Legs</option>
                        <option value="Shoulders">Shoulders</option>
                        <option value="Biceps">Biceps</option>
                        <option value="Triceps">Triceps</option>
                    </select>

                        <div className={styles.section}>
                            <h2>Equipment</h2>

                            <div className={styles.equipmentGrid}>

                                {equipmentList.map((eq: string) => (
                                    <div className={styles.equipmentItem} key={eq}>
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={equipment.includes(eq)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setEquipment([...equipment, eq]);
                                                    } else {
                                                        setEquipment(
                                                            equipment.filter((v: string) => v !== eq)
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
                                            checked={equipment.includes("gym")}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setEquipment([...equipment, "gym"]);
                                                } else {
                                                    setEquipment(
                                                        equipment.filter(v => v !== "gym")
                                                    );
                                                }
                                            }}
                                        />
                                        Gym
                                    </label>
                                </div>

                            </div>
                        </div>
                        <button
                            onClick={() => { setShowFilters(false) }}
                        >Save Filters</button>


                    </>


                    }

                    {!showFilters &&
                        <><button onClick={() => { setShowFilters(true); }}>
                            Filter
                        </button>
                            <button onClick={() => { setIsClosed(true); onClose() }}>
                                Close
                            </button>

                            {!isClosed && (
                                <div className={styles.exerciseList}>
                                    {filteredExercises.map((exercise) => (
                                        <SelectorCard key={exercise.exerciseSourceId} exercise={exercise} />
                                    ))}
                                </div>
                            )}
                        </>
                    }
                </div>
            </div>
        </>
    );
}
