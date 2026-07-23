export interface AuthFormProps {
    mode: "login" | "signup";
}
export interface WorkoutCardProps {
    id: string;
    name: string;
    exerciseCount: number;
    volume: number;
    onUpdate: () => void;

}

export interface Sets {
    weight: number;
    reps: number;
}

export interface Exercises {
    docId: string;
    id: string;
    exerciseName: string;
    exerciseOrder: number;
    exerciseSourceId: number;
    imageUrl: string;
    muscleGroup: string;
    rest: number;
    sets: Record<string, Sets>;
};

export interface Workout {
    name: string;
    exercises: Record<string, Exercises>;
};

export interface ExerciseCardProps {
    exercise: Exercises;
    onUpdate: () => void;
}

export interface WgerExercise {
    docId: string,
    exerciseSourceId: number;
    name: string;
    imageUrl: string;
    category: string;   // legs, arms, chest, back, ...
    muscleGroup: string;
    equipment: string[];

}

export interface SelectorCardProps {
    exercise: WgerExercise
}

export interface ExerciseSelectorProps {
    documentId: string;
    onClose: () => void;
}