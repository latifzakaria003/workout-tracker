import { useEffect, useState } from "react";
import type { WgerExercise, WgerApiResponse } from "../types";
import { ExerciseContext } from "./exerciseContext";

// esercizi cardio che posso fare alla fine
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

const EXCLUDED_KEYWORDS = [
    // breathing
    "breathing",
    "breath",
    "respir",
    "diaphragmatic",

    // stretching
    "stretch",
    "stretching",

    // warm-up
    "warm up",
    "warmup",
    "warm-up",
    "cool down",
    "cooldown",

    // meditation / relaxation
    "meditation",
    "relaxation",

    // rehabilitation
    "rehab",
    "rehabilitation",

];

export const ExerciseProvider = ({ children }: { children: React.ReactNode }) => {
    const [exercises, setExercises] = useState<WgerExercise[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExercises = async () => {
            try {
                const response = await fetch(
                    "https://wger.de/api/v2/exerciseinfo/?limit=852"
                );

                const data: WgerApiResponse = await response.json();
                const mappedExercises = data.results
                    .filter((exercise) => {

                        const translation = exercise.translations.find(
                            t => t.language === 2
                        );

                        const name = translation?.name?.toLowerCase() ?? "";

                        // Elimina esercizi con keyword non desiderate
                        if (EXCLUDED_KEYWORDS.some(word => name.includes(word))) {
                            return false;
                        }

                        // Se è cardio, tieni SOLO quello continuo
                        if (exercise.category.name.toLowerCase() === "cardio") {
                            return CONTINUOUS_CARDIO_ID.includes(exercise.id);
                        }

                        // Tutti gli altri esercizi vanno bene
                        return true;
                    })
                    .map((exercise) => {

                        const translation = exercise.translations.find(
                            t => t.language === 2
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
