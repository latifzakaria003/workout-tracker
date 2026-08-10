import { Timestamp } from "firebase/firestore";
// ../components/authForm.tsx
export interface AuthFormProps {
    mode: "login" | "signup";
}

// ../components/workoutCard.tsx
// ../pages/home.tsx
export interface WorkoutCardProps {
    id: string;
    name: string;
    exerciseCount: number;
    volume: number;
    cardOrder: number;
    onUpdate: () => void;

}

// ../functions/workoutGenerator.ts
export interface Sets {
    weight: number;
    reps: number;
    completed: boolean;
}

// ../pages/editWorkout.tsx
// ../functions/workoutGenerator.ts
export interface Exercises {
    docId: string;  // id of the document
    id: string; // id of the exercise
    exerciseName: string;
    exerciseCategory: string;
    exerciseOrder: number;
    exerciseSourceId: number;
    imageUrl: string;
    muscleGroup: string | MuscleGroup[];
    rest: number;
    sets: Record<string, Sets>;
};


// ../components/selectorCard.tsx
// ../pages/editWorkout.tsx
// ../pages/home.tsx
export interface Workout {
    name: string;
    exercises: Record<string, Exercises>;
    cardOrder: number;
};

// ../components/selectorCard.tsx
// ../functions/workoutGenerator.ts
// ../hooks/exerciseProvider.tsx
export interface WgerExercise {
    docId: string,
    exerciseSourceId: number;
    name: string;
    imageUrl: string;
    category: string;   // legs, arms, chest, back, cardio ...
    muscleGroup: string;
    muscleGroupArray: MuscleGroup[];
    secondaryMuscleGroup: SecondaryMuscle[];
    equipment: string[];
}
interface MuscleGroup {
    name_en: string;
}

// ../components/exerciseCard.tsx
export interface ExerciseCardProps {
    exercise: Exercises;
    session?: WorkoutSession;
    onUpdate?: () => void;
    onToggleSet?: (exercise: Exercises, setId: string, rest: number,) => void;
    isDone?: boolean;
    isEditable?: boolean;
}

// ../components/exerciseSelector
export interface ExerciseSelectorProps {
    documentId: string;
    onClose: () => void;
}


// ../hooks/exerciseProvider.tsx
export interface WgerApiResponse {
    results: WgerExerciseApi[];
}

interface WgerExerciseApi {
    id: number;
    translations: WgerTranslation[];
    images: {
        image: string;
    }[];
    category: {
        name: string;
    };
    muscles: {
        name: string;
        name_en: string;
    }[];
    muscles_secondary: SecondaryMuscle[];
    equipment: WgerEquipment[];
}

interface WgerTranslation {
    language: number;
    name: string;
}
interface SecondaryMuscle {
    name_en: string;
}

// ../functions/workoutGeneratoion.tsx
export interface WgerEquipment {
    name: string
}

// ../contexts/exerciseContext.tsx
export interface ExerciseContextType {
    exercises: WgerExercise[];
    loading: boolean;
}

// ../functions/workoutGenerator.ts
export interface GoalParams {
    sets: [number, number];
    reps: [number, number];
    rest: number;          // secondi
    cardioPercentage: number;
    timePerRep: number;    // secondi
}

// ../functions/workoutGenerator.ts
export interface ConstraintProps {
    minNumOfExercises: number;
    PriorityMuscles: string[];
    secondaryMuscles: string[];
}

// ../functions/workoutGeneratoion.tsx
// ../functions/workoutGenerator.ts
export type Goal = "strength" | "hypertrophy" | "endurance" | "weight loss" | "general fitness";

// ../functions/workoutGenerator.ts
export interface WorkoutPlan {
    workout: WgerExercise[],
    sets: number[];
}

// Session info
export interface WorkoutSession {
    title: string;
    active: boolean;
    remainingRest: number | null;
    startedAt: Timestamp | null;
    finishedAt: Timestamp | null;
    description: string;
    completed: string[];
}

export interface HistoryProps {
    date: Timestamp,
    duration: number,
    title: string,
    description: string,
    exercises: Record<string, Exercises>
}

export interface HistoryExercises {
    docId: string,
    date: Timestamp,
    duration: number,
    title: string,
    description: string,
    exercises: Exercises[]
}

