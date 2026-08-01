import { useContext } from "react";
import { ExerciseContext } from "../contexts/exerciseContext";

export const useExercises = () => {
    const context = useContext(ExerciseContext);

    if (!context) {
        throw new Error(
            "useExercises must be used inside ExerciseProvider"
        );
    }

    return context;
};