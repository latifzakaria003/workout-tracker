export interface AuthFormProps {
    mode: "login" | "signup";
}
export interface WorkoutCardProps {
    id: string;
    name: string;
    exerciseCount: number;
    volume: number;
    cardOrder: number;
    onUpdate: () => void;

}

export interface Sets {
    weight: number;
    reps: number;
}

export interface Exercises {
    docId: string;  // id of the document
    id: string; // id of the exercise
    exerciseName: string;
    exerciseOrder: number;
    exerciseSourceId: number;
    imageUrl: string;
    muscleGroup: string | MuscleGroup[];
    rest: number;
    sets: Record<string, Sets>;
};

export interface Workout {
    name: string;
    exercises: Record<string, Exercises>;
    cardOrder: number;
};

export interface ExerciseCardProps {
    exercise: Exercises;
    session: WorkoutSession;
    onUpdate: () => void;
    onToggleSet: (id: string, setId: string, rest: number,) => void;
}

export interface WgerExercise {
    docId: string,
    exerciseSourceId: number;
    name: string;
    imageUrl: string;
    category: string;   // legs, arms, chest, back, ...
    muscleGroup: string | MuscleGroup[];
    secondaryMuscleGroup: string[];
    equipment: string[];
}

interface MuscleGroup {
    name_en: string;
}

export interface ExerciseSelectorProps {
    documentId: string;
    onClose: () => void;
}

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
        name_en: string;
    }[];
    muscles_secondary: {
        name_en: string
    }[];
    equipment: WgerEquipment[];
}

interface WgerTranslation {
    language: number;
    name: string;
}
export interface WgerEquipment {
    name: string
}

export interface ExerciseContextType {
    exercises: WgerExercise[];
    loading: boolean;
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

export interface WorkoutSession {
    started: boolean;
    completedSets: Record<string, boolean>;
    remainingRest: number | null;
    activeSetId: string | null;
    activeExerciseId: string | null;
    finished: boolean;
}