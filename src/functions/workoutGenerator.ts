import type { GoalParams, WgerExercise, ConstraintProps, Goal, WorkoutPlan } from '../types';

export const GOAL_PARAMS: Record<Goal, GoalParams> = {
    "strength": { sets: [3, 5], reps: [3, 6], rest: 180, cardioPercentage: 0, timePerRep: 5 },
    "hypertrophy": { sets: [3, 4], reps: [8, 12], rest: 90, cardioPercentage: 0, timePerRep: 4 },
    "endurance": { sets: [2, 3], reps: [15, 20], rest: 45, cardioPercentage: 20, timePerRep: 3 },
    "weight loss": { sets: [3, 4], reps: [10, 15], rest: 60, cardioPercentage: 40, timePerRep: 4 },
    "general fitness": { sets: [3, 3], reps: [10, 15], rest: 60, cardioPercentage: 10, timePerRep: 4 },
};

export function getSplit(sessionsPerWeek: number): string[] {
    switch (sessionsPerWeek) {
        case 1: return ["full body"];
        case 2: return ["upper", "lower"];
        case 3: return ["push", "pull", "legs"];
        case 4: return ["push", "pull", "legs", "upper"];
        case 5: return ["push", "pull", "legs", "upper", "lower"];
        case 6: return ["push", "pull", "legs", "push", "pull", "legs"];
        case 7: return ["push", "pull", "legs", "push", "pull", "legs", "full body"];
        default: return ["full body"];
    }
}

const CONSTRAINTS: Record<string, ConstraintProps> = {
    "full body": {
        minNumOfExercises: 3,
        PriorityMuscles: ["Chest", "Back", "Legs"],
        secondaryMuscles: ["Biceps", "Triceps", "Shoulders", "Calves", "Abs"]
    },
    "upper": {
        minNumOfExercises: 2,
        PriorityMuscles: ["Chest", "Back"],
        secondaryMuscles: ["Biceps", "Triceps", "Shoulders"]
    },
    "lower": {
        minNumOfExercises: 1,
        PriorityMuscles: ["Legs"],
        secondaryMuscles: ["Calves", "Glutes"]
    },
    "push": {
        minNumOfExercises: 2,
        PriorityMuscles: ["Chest", "Triceps"],
        secondaryMuscles: ["Shoulders"]
    },
    "pull": {
        minNumOfExercises: 2,
        PriorityMuscles: ["Back", "Biceps"],
        secondaryMuscles: ["Shoulders"]
    },
    "legs": {
        minNumOfExercises: 1,
        PriorityMuscles: ["Legs"],
        secondaryMuscles: ["Calves", "Glutes"]
    }
};

function generateNumExercises(goal: Goal, sessionDuration: number): [number, number] {
    const totalSeconds = sessionDuration * 60 - 300;
    const params = GOAL_PARAMS[goal];

    const cardioTime = (totalSeconds * params.cardioPercentage) / 100;
    const exercisesTime = totalSeconds - cardioTime;

    const numSets = params.sets[0];
    const numReps = params.reps[0];
    const timePerSet = params.timePerRep * numReps;

    // Tempo totale stimato per 1 esercizio (set + rest)
    const timePerExercise = numSets * timePerSet + (numSets - 1) * params.rest;

    const numExercises = Math.max(1, Math.floor(exercisesTime / timePerExercise));
    const numCardioExercises = Math.floor(cardioTime / timePerExercise);

    return [numExercises, numCardioExercises];
}

function pickExercise(
    candidates: WgerExercise[],
    used: Set<number>
): WgerExercise | null {

    const available = candidates.filter(
        e => !used.has(e.exerciseSourceId)
    );

    if (available.length === 0)
        return null;

    const random =
        Math.floor(Math.random() * available.length);

    const chosen = available[random];

    used.add(chosen.exerciseSourceId);

    return chosen;
}

function filterByEquipment(exercises: WgerExercise[], userEquipment: string[]): WgerExercise[] {
    if (userEquipment.includes("gym")) return exercises;
    return exercises.filter(ex =>
        ex.equipment && ex.equipment.some(eq => userEquipment.includes(eq))
    );
}

function GenerateExercises(
    split: string[],
    numEx: [number, number],
    sets: number,
    exercises: WgerExercise[],
    userEquipment: string[]
): WorkoutPlan[] {
    const workout: WorkoutPlan[] = [];
    const [targetNumExercises, numCardio] = numEx;

    for (const daySplit of split) {
        const constraint = CONSTRAINTS[daySplit];
        const userExercises: WgerExercise[] = [];
        const usedExercises = new Set<number>();

        // Uniamo muscoli primari e secondari
        const targetMuscles = [...constraint.PriorityMuscles, ...constraint.secondaryMuscles];
        let muscleIdx = 0;

        const effectiveNumEx = Math.max(targetNumExercises, constraint.minNumOfExercises);

        for (let k = 0; k < effectiveNumEx; k++) {
            const currentMuscle = targetMuscles[muscleIdx % targetMuscles.length];

            // Trova esercizi compatibili
            let candidates = exercises.filter(ex =>
                ex.muscleGroup === currentMuscle ||
                ex.category === currentMuscle ||
                (ex.secondaryMuscleGroup && ex.secondaryMuscleGroup.includes(currentMuscle))
            );

            candidates = filterByEquipment(candidates, userEquipment);

            // Fallback: se non trova nulla per quel muscolo, prende qualsiasi esercizio compatibile con l'attrezzatura
            // non dovrebbe succedere mai dato che ci sono più esercizi a corpo libero per ogni muscolo
            if (candidates.length === 0) {
                candidates = filterByEquipment(exercises, userEquipment);
            }

            const exercise = pickExercise(candidates, usedExercises);
            if (exercise) {
                userExercises.push(exercise);
            }
            muscleIdx++;
        }

        workout.push({ workout: userExercises, sets });
    }

    // Aggiunta Cardio
    if (numCardio > 0) {
        let cardioCandidates = exercises.filter(ex => ex.category === "Cardio");
        cardioCandidates = filterByEquipment(cardioCandidates, userEquipment);

        if (cardioCandidates.length > 0) {
            for (let c = 0; c < numCardio; c++) {
                for (let i = 0; i < workout.length; i++) {
                    const randomIdx = Math.floor(Math.random() * cardioCandidates.length);
                    workout[i].workout.push(cardioCandidates[randomIdx]);
                }
            }
        }
    }

    return workout;
}

export const GenerateWorkout = (
    exercises: WgerExercise[],
    sessionsPerWeek: number,
    sessionDuration: number,
    goal: Goal,
    userEquipment: string[]
) => {
    const sets = GOAL_PARAMS[goal].sets[1];
    const split = getSplit(sessionsPerWeek);
    const numExercises = generateNumExercises(goal, sessionDuration);

    return GenerateExercises(split, numExercises, sets, exercises, userEquipment);
};