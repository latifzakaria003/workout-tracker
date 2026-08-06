import { useEffect, useState } from "react";
import type { WgerExercise, WgerApiResponse } from "../types";
import { ExerciseContext } from "./exerciseContext";



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

                const mappedExercises = data.results.map((exercise) => {
                    const translation = exercise.translations.find(
                        t => t.language === 2
                    );
                    const muscle: string = (exercise.muscles.length == 0) ? exercise.category.name : ((exercise.muscles[0].name_en) ? exercise.muscles[0].name_en : exercise.muscles[0].name)
                    return {
                        docId: crypto.randomUUID(),
                        exerciseSourceId: exercise.id,
                        name: translation?.name ?? "Unknown",
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
