import { createContext, useContext } from "react";
import type { ExerciseContextType } from "../types";


export const ExerciseContext = createContext<ExerciseContextType | null>(null);

export const useExercise = () => {
    const context = useContext(ExerciseContext);

    if (!context) {
        throw new Error("useExercise was called outside of <ExerciseProvider>");
    }

    return context;
};