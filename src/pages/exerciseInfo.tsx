import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { ExerciseInfoParams, WgerExerciseApi } from "../types";
import styles from "./ExerciseInfo.module.css";
import { Navbar } from "../components/navbar";

const ENGLISH_ID = 2;

export const ExerciseInfo = () => {
    const { sourceId } = useParams<{ sourceId: string }>();

    const [exercise, setExercise] = useState<ExerciseInfoParams>(); // informazioni sull'esercizio
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();

    useEffect(() => {
        if (!sourceId) {
            setError("Couldnt find the ID");
            setLoading(false);
            return;
        }

        const controller = new AbortController(); // ferma il fetching se cambio pagina

        const getInfo = async () => {
            setLoading(true);
            setError(undefined);

            try {
                const response = await fetch(
                    `https://wger.de/api/v2/exerciseinfo/${sourceId}/`,
                    { signal: controller.signal }
                );

                if (!response.ok)
                    throw new Error(`Wger response: ${response.status}`);

                const data: WgerExerciseApi = await response.json();

                const translation = data.translations.find(t => t.language === ENGLISH_ID); // voglio i dati in inglese

                setExercise({
                    category: data.category?.name ?? "",
                    primaryMuscles: data.muscles ?? [],
                    secondaryMuscles: data.muscles_secondary ?? [],
                    equipment: data.equipment ?? [],
                    images: (data.images ?? []).map(img => img.image),
                    name: translation?.name ?? data.category?.name ?? "exercise",
                    description: translation?.description ?? "",
                    notes: translation?.notes ?? [],
                });
            } catch (err) {
                if (controller.signal.aborted) return;
                console.error(err);
                setError("Unable to fetch the exercise, try again.");
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };

        getInfo();

        return () => controller.abort();
    }, [sourceId]);

    if (loading) {
        return (
            <div className={styles.page}>
                <p className={styles.state} role="status">Loading...</p>
            </div>
        );
    }

    if (error || !exercise) {
        return (
            <div className={styles.page}>
                <p className={`${styles.state} ${styles.stateError}`} role="alert">
                    {error ?? "Exercise not found."}
                </p>
            </div>
        );
    }

    const hasMuscles =
        exercise.primaryMuscles.length > 0 || exercise.secondaryMuscles.length > 0;

    return (

        <>
            <Navbar />
            <article className={styles.page}>
                <header className={styles.header}>
                    {exercise.category && (
                        <p className={styles.eyebrow}>{exercise.category}</p>
                    )}
                    <h1 className={styles.title}>{exercise.name}</h1>
                </header>

                {/* immagini dell'esercizio */}

                {exercise.images.length > 0 && (
                    <div className={styles.gallery}>
                        {exercise.images.map(image => (
                            <img
                                key={image}
                                className={styles.image}
                                src={image}
                                alt={exercise.name}
                                loading="lazy"
                            />
                        ))}
                    </div>
                )}

                {/* muscoli utilizzati */}

                {hasMuscles && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Muscles involved</h2>

                        <ul className={styles.muscleList}>
                            {exercise.primaryMuscles.map(muscle => (
                                <li
                                    key={`p-${muscle.name_en || muscle.name}`}
                                    className={`${styles.muscle} ${styles.musclePrimary}`}
                                >
                                    {muscle.name_en || muscle.name}
                                </li>
                            ))}

                            {exercise.secondaryMuscles.map(muscle => (
                                <li
                                    key={`s-${muscle.name_en || muscle.name}`}
                                    className={`${styles.muscle} ${styles.muscleSecondary}`}
                                >
                                    {muscle.name_en || muscle.name}
                                </li>
                            ))}
                        </ul>

                        <p className={styles.legend}>
                            <span className={styles.legendKey} aria-hidden="true" />
                            Full: primarly involved muscles · Dashed: muscles involved less
                        </p>
                    </section>
                )}

                {/* equipaggiamento utilizzato */}

                {exercise.equipment.length > 0 && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Equipment</h2>
                        <ul className={styles.plainList}>
                            {exercise.equipment.map(eq => (
                                <li key={eq.name} className={styles.plainItem}>
                                    {eq.name}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* descrizione dell'esercizio */}

                {exercise.description && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Description</h2>
                        <div
                            className={styles.prose}
                            dangerouslySetInnerHTML={{ __html: exercise.description }}
                        />
                    </section>
                )}

                {/* note sull'esercizio */}

                {exercise.notes.length > 0 && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Notes</h2>
                        <ul className={styles.plainList}>
                            {exercise.notes.map((note, i) => (
                                <li key={i} className={styles.plainItem}>
                                    {note.comment}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </article>
        </>
    );
};
