import { useEffect, useState } from 'react';
import type { WgerExercise } from '../types';
import { SelectorCard } from './selectorCard';
import styles from './exerciseSelector.module.css';
import { useParams } from 'react-router-dom';

export const ExerciseSelector = () => {

    const { documentId } = useParams();

    const [exercises, setExercises] = useState<WgerExercise[]>([])
    const [search, setSearch] = useState("")
    const [isClosed, setIsClosed] = useState(false);
    const [loading, setLoading] = useState(true);

    const getExercises = async () => {
        try {
            const response = await fetch(
                "https://wger.de/api/v2/exerciseinfo/?limit=852"
            );

            const data = await response.json();


            setExercises(data.results.map((exercise: any) => {
                const translation = exercise.translations.find(
                    (t: any) => t.language === 2
                );

                return {
                    docId: documentId,
                    exerciseSourceId: exercise.id,
                    name: translation?.name ?? "Unknown",
                    imageUrl: exercise.images?.[0]?.image ?? "",
                    category: exercise.category.name,
                    muscleGroup: exercise.muscles[0]?.name_en ?? "",
                    equipment: exercise.equipment.map((e: any) => e.name)
                };
            }))

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredExercises = exercises
        .filter((exercise) =>
            exercise.name
                .toLowerCase()
                .includes(search.toLowerCase())
        ).slice(0, 10);


    useEffect(() => {
        getExercises();

    }, [])


    return (

        <>
            <div className={styles.container}>

                <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Search exercise..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setIsClosed(false); }}
                />
                <button
                    onClick={() => setIsClosed(true)}
                >
                    Close
                </button>

                {loading && (
                    <div className={styles.loader}>
                        Loading exercises...
                    </div>
                )}

                {!isClosed &&
                    <div className={styles.exerciseList}>
                        {filteredExercises.map((exercise) => (
                            <SelectorCard
                                exercise={exercise}
                            />
                        ))}
                    </div>}

            </div>


        </>
    );
}
