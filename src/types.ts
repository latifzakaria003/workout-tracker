import { Timestamp } from "firebase/firestore";
// ./components/authForm.tsx
export interface AuthFormProps {
    mode: "login" | "signup";
}
// ./pages/profile.tsx
export interface UserProfile {
    heightCm: number | null;
    weightKg: number | null;
    birthDate: string;      // "YYYY-MM-DD", come lo dà <input type="date">
    experience: string;
    notes: string;
}

// ./components/workoutCard.tsx
// ./pages/home.tsx
export interface WorkoutCardProps {
    id: string;
    name: string;
    exerciseCount: number;
    volume: number;
    cardOrder: number;
    onUpdate: () => void;

}

// ./assets/workoutGenerator.ts
// ./pages/editWorkout.tsx
// ./pages/workoutGeneration.tsx
export interface Sets {
    weight: number;
    reps: number;
    completed: boolean;
}

// ./pages/editWorkout.tsx
// ./pages/workoutGeneration.tsx
// ./pages/history.tsx
export interface Exercises {
    docId: string;  // id del documento
    id: string; // id dell'esercizio
    exerciseName: string;
    exerciseCategory: string;
    exerciseOrder: number;
    exerciseSourceId: number;
    imageUrl: string;
    muscleGroup: string | MuscleGroup[];
    rest: number;
    sets: Record<string, Sets>;
};


// ./components/selectorCard.tsx
// ./pages/editWorkout.tsx
// ./pages/home.tsx
export interface Workout {
    name: string;
    exercises: Record<string, Exercises>;
    cardOrder: number;
    userId: string;
};

// ./assets/workoutGenerator.ts
// ./contexts/exerciseProvider.tsx
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

// ./components/exerciseCard.tsx
export interface ExerciseCardProps {
    exercise: Exercises;
    session?: SessionView;
    onUpdate?: () => void;
    onToggleSet?: (exercise: Exercises, setId: string, rest: number) => void;
    isDone: boolean;
    isEditable?: boolean;
}

// ./components/selectorCard.tsx
export interface SelectorCardProps {
    exercise: WgerExercise;
    documentId: string;
    onAdded?: () => void;
}

// ./components/exerciseSelector.tsx
export interface ExerciseSelectorProps {
    documentId: string;
    onClose: () => void;
    onAdded?: () => void;
}


// ./contexts/exerciseProvider.tsx
export interface WgerApiResponse {
    results: WgerExerciseApi[];
}

// ./pages/exerciseInfo.tsx
export interface WgerExerciseApi {
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
    muscles_secondary: { name_en: string }[];
    equipment: WgerEquipment[];
}

interface WgerTranslation {
    language: number;
    name: string;
    description?: string;
    notes?: { comment: string }[];
}
interface SecondaryMuscle {
    name_en: string;
    name?: string;
}

// ./pages/workoutGeneration.tsx
export interface WgerEquipment {
    name: string
}

// ./contexts/exerciseContext.ts
export interface ExerciseContextType {
    exercises: WgerExercise[];
    loading: boolean;
}

// ./assets/workoutGenerator.ts
export interface GoalParams {
    sets: [number, number];
    reps: [number, number];
    rest: number;          // secondi
    cardioPercentage: number;
    timePerRep: number;    // secondi
}

// ./assets/workoutGenerator.ts
export interface ConstraintProps {
    minNumOfExercises: number;
    priorityMuscles: string[];
    secondaryMuscles: string[];
}

// ./pages/workoutGeneratoion.tsx
// ./assets/workoutGenerator.ts
export type Goal = "strength" | "hypertrophy" | "endurance" | "weight loss" | "general fitness";

// ./assets/workoutGenerator.ts
export interface PlannedExercise {
    exercise: WgerExercise;
    sets: number;
    reps: number;        // per il cardio sono minuti
    isCardio: boolean;
}

// ./assets/workoutGenerator.ts
export interface WorkoutPlan {
    split: string;
    exercises: PlannedExercise[];
}

// ./contexts/sessionContext.ts
// ./contexts/sessionProvider.tsx
export interface WorkoutSession {
    workoutId: string;
    title: string;
    restEndsAt: number | null;
    startedAt: number | null;
    finishedAt: number | null;
    description: string;
    completed: string[];
}
interface SessionView extends WorkoutSession {
    active: boolean;
    remainingRest: number | null;
}

// ./pages/history.tsx
// ./pages/profile.tsx
export interface HistoryProps {
    date: Timestamp,
    duration: number,
    title: string,
    description: string,
    exercises: Exercises[],
    userId: string,
}

// ./pages/history.tsx
export interface HistoryExercises {
    docId: string,
    date: Timestamp,
    duration: number,
    title: string,
    description: string,
    exercises: Exercises[]
}

// ./pages/exerciseInfo.tsx
export interface ExerciseInfoParams {
    category: string,
    primaryMuscles: {
        name: string;
        name_en: string;
    }[],
    secondaryMuscles: SecondaryMuscle[],
    equipment: WgerEquipment[],
    images: string[],
    name: string,
    description: string,
    notes: { comment: string }[],
}

// ./assets/workoutGenerator.ts
export interface VolumeChoice {
    sets: number;
    reps: number;
    secondsPerExercise: number;
}

// ./components/selectorCard.tsx
export type Feedback = { text: string; ok: boolean } | null;
