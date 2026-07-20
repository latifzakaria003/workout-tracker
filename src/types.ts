export interface AuthFormProps {
    mode: "login" | "signup";
}
export interface WorkoutCardProps {
    id: string;
    name: string;
    exerciseCount: number;
    volume: number;
}

export interface Sets {
    weight: number;
    reps: number;
}

export interface Exercises {
    exerciseName: string;
    exerciseOrder: number;
    exerciseSourceId: number;
    imageUrl: string;
    muscleGroup: string;
    rest: number;
    sets: Sets[];
};

export interface Workout {
    name: string;
    exercises: Record<string, Exercises>;
};
