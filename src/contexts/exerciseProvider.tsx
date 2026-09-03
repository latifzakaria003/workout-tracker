import { useEffect, useState } from "react";
import type { WgerExercise, WgerApiResponse } from "../types";
import { ExerciseContext } from "./exerciseContext";

// filtri per wger

// ID per esercizi in lingua inglese
const ENGLISH_ID = 2;

// esercizi cardio accettabili
const CONTINUOUS_CARDIO_ID = [
    908,
    962,
    1104,
    1204,
    1093,
    1376,
    1449,
    1526,
    1548
];

// parole chiave di esercizi non validi
const EXCLUDED_KEYWORDS = [
    // esercizi di respirazione 
    "breathing",
    "breath",
    "respir",
    "diaphragmatic",

    // esercizi di stretching
    "stretch",
    "stretching",
    "roller",
    "foam",

    // esercizi di riscaldamento
    "warm up",
    "warmup",
    "warm-up",
    "cool down",
    "cooldown",

    // esercizi di rilassamento e meditazione
    "meditation",
    "relaxation",

    // esercizi di riabilitazione
    "rehab",
    "rehabilitation",

    // esercizi di riposo
    "rest",
    "resting",

    // esercizi di posa
    "pose",
    "posing",

    // esercizi di inclinazione
    "tilt",
    "tilting"
];

export const ExerciseProvider = ({ children }: { children: React.ReactNode }) => {
    const [exercises, setExercises] = useState<WgerExercise[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExercises = async () => {
            try {
                // recupero esercizi
                const response = await fetch(
                    "https://wger.de/api/v2/exerciseinfo/?limit=852"
                );


                const data: WgerApiResponse = await response.json();
                const mappedExercises = data.results
                    .filter((exercise) => {
                        // filtraggio degli esercizi
                        const translation = exercise.translations.find(
                            t => t.language === ENGLISH_ID
                        );

                        const name = translation?.name?.toLowerCase() ?? "";

                        if (EXCLUDED_KEYWORDS.some(word => name.includes(word)))
                            return false;

                        if (exercise.category.name.toLowerCase() === "cardio")
                            return CONTINUOUS_CARDIO_ID.includes(exercise.id);

                        return true;
                    })
                    .map((exercise) => {
                        // recupero degli esercizi che passano il filtro
                        const translation = exercise.translations.find(
                            t => t.language === ENGLISH_ID
                        );

                        const muscle: string =
                            exercise.muscles.length === 0
                                ? exercise.category.name
                                : (
                                    exercise.muscles[0].name_en
                                        ? exercise.muscles[0].name_en
                                        : exercise.muscles[0].name
                                );

                        return {
                            docId: crypto.randomUUID(),
                            exerciseSourceId: exercise.id,
                            name: translation?.name ?? `${exercise.category.name} exercise`,
                            imageUrl: exercise.images[0]?.image ?? "",
                            category: exercise.category.name,
                            muscleGroup: muscle,
                            muscleGroupArray: exercise.muscles,
                            secondaryMuscleGroup: exercise.muscles_secondary,
                            equipment: exercise.equipment.map(e => e.name),
                        };
                    });

                setExercises(mappedExercises);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchExercises();
    }, []);


    return (
        <ExerciseContext.Provider value={{ exercises, loading }}>
            {children}
        </ExerciseContext.Provider>
    );
};
