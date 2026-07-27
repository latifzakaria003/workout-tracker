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
    secondaryMuscleGroup: string[];
    equipment: string[];
}

export interface SelectorCardProps {
    exercise: WgerExercise
}

export interface ExerciseSelectorProps {
    documentId: string;
    onClose: () => void;
}

export interface ExerciseGenerationProps {
    goal: string;
    sessionsPerWeek: number;
    sessionsDuration: number;
    equipment: string[];
}

export interface GoalSettings {
    sets: number[];
    reps: number[];
    rest: number;
    cardioPercentage: number;
}

export interface GoalParams {
    sets: [number, number];
    reps: [number, number];
    rest: number;          // secondi
    cardioPercentage: number;
    timePerRep: number;    // secondi
}

export interface WorkoutSession {
    day: string;
    sets: number;
    reps: number;
    rest: number;
    exercises: WgerExercise[];
}

export interface ConstraintProps {
    minNumOfExercises: number;
    PriorityMuscles: string[];
    secondaryMuscles: string[];
}

export type Goal = "strength" | "hypertrophy" | "endurance" | "weight loss" | "general fitness";

export interface WorkoutPlan {
    workout: WgerExercise[],
    sets: number;
}