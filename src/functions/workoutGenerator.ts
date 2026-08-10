import type { GoalParams, WgerExercise, ConstraintProps, Goal, WorkoutPlan } from '../types';

export const GOAL_PARAMS: Record<Goal, GoalParams> = {
    "strength": { sets: [3, 5], reps: [3, 6], rest: 180, cardioPercentage: 0, timePerRep: 5 },
    "hypertrophy": { sets: [3, 4], reps: [8, 12], rest: 90, cardioPercentage: 0, timePerRep: 4 },
    "endurance": { sets: [2, 3], reps: [15, 20], rest: 45, cardioPercentage: 20, timePerRep: 3 },
    "weight loss": { sets: [3, 4], reps: [10, 15], rest: 60, cardioPercentage: 30, timePerRep: 4 },
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
        secondaryMuscles: ["Shoulders", "Biceps", "Triceps"]
    },
    "lower": {
        minNumOfExercises: 1,
        PriorityMuscles: ["Legs"],
        secondaryMuscles: ["Calves", "Glutes", "Abs"]
    },
    "push": {
        minNumOfExercises: 2,
        PriorityMuscles: ["Chest"],
        secondaryMuscles: ["Shoulders", "Triceps"]
    },
    "pull": {
        minNumOfExercises: 2,
        PriorityMuscles: ["Back"],
        secondaryMuscles: ["Biceps", "Rear Delts"]
    },
    "legs": {
        minNumOfExercises: 1,
        PriorityMuscles: ["Legs"],
        secondaryMuscles: ["Calves", "Glutes"]
    }
};

function pickExercise(candidates: WgerExercise[], used: Set<number>): WgerExercise | null {
    const available = candidates.filter(e => !used.has(e.exerciseSourceId));

    const pool = available.length > 0 ? available : candidates;

    if (pool.length === 0) return null;

    const random = Math.floor(Math.random() * pool.length);
    const chosen = pool[random];

    used.add(chosen.exerciseSourceId);
    return { ...chosen };
}

function filterByEquipment(exercises: WgerExercise[], userEquipment: string[]): WgerExercise[] {
    if (userEquipment.includes("gym")) return exercises;
    const isCardio = exercises.find(exercise => exercise.category.toLowerCase() === "cardio")
    if (isCardio) {
        return exercises.filter(ex =>
            !ex.equipment || ex.equipment.length === 0 || ex.equipment.some(eq => userEquipment.includes(eq))
        );
    }
    return exercises.filter(ex =>
        ex.equipment.some(eq => userEquipment.includes(eq))
    );
}

export const GenerateWorkout = (
    exercises: WgerExercise[],
    sessionsPerWeek: number,
    sessionDuration: number,
    goal: Goal,
    userEquipment: string[]
) => {
    const split = getSplit(sessionsPerWeek);
    return GenerateExercises(split, exercises, userEquipment, goal, sessionDuration, sessionsPerWeek);
};


export function setNumExercises(goal: Goal, sessionDuration: number, sessionsPerWeek: number): number[][] {
    const params = GOAL_PARAMS[goal];

    const durationInSeconds = sessionDuration * 60 - 300; // removing 5 minutes

    const split = getSplit(sessionsPerWeek);
    const result: number[][] = [];


    for (const daysplit of split) {
        const numPriority = CONSTRAINTS[daysplit].minNumOfExercises;

        const arrExercises = defineArray(params, durationInSeconds, daysplit);

        // Se non riesce a trovare una configurazione adatta
        if (arrExercises.length === 0) {
            result.push([]);
            continue;
        }

        const tempArray = [];
        if (arrExercises[3] < numPriority) {
            let newSet = 0;
            const numExercises = arrExercises[3];
            for (let i = 0; i < numExercises; i++)
                tempArray.push(arrExercises[0]);

            let i = 0;
            while (newSet < tempArray[(numExercises - 1)] && (tempArray[0] - 1) > newSet && tempArray[(numExercises - 1)] > 0) {
                newSet += 1;
                tempArray[(((numExercises - 1) - i) % numExercises)] -= 1;
                i++;
            }
            tempArray.push(newSet);
        } else {
            let workoutTime = 0;
            const timePerExercise = arrExercises[2];

            // FIX: cicliamo per il numero reale di esercizi trovati, non sempre 2 volte
            for (let i = 0; i < arrExercises[3]; i++) {
                workoutTime += timePerExercise;
            }

            // FIX: logica del while sistemata. Aggiungo esercizi finché c'è tempo materiale per farlo.
            while ((workoutTime + timePerExercise) <= durationInSeconds) {
                arrExercises[3] += 1;
                workoutTime += timePerExercise;
            }
        }

        if (tempArray.length > 0) {
            result.push([...tempArray, arrExercises[1]]);
        } else {
            for (let i = 0; i < arrExercises[3]; i++)
                tempArray.push(arrExercises[0]);
            result.push([...tempArray, arrExercises[1]]);
        }
    }

    return result;
}

export function defineArray(params: GoalParams, durationInSeconds: number, split: string): number[] {
    const constraint = CONSTRAINTS[split];

    let numExercises = constraint.minNumOfExercises;
    let timeLimit = Math.floor(durationInSeconds / numExercises);

    let max = 0;
    let finalArray: number[] = [];

    let found = false;
    while (!found) {
        for (const numSets of params.sets) {
            for (const numReps of params.reps) {
                const time = numSets * params.timePerRep * numReps + numSets * params.rest;
                if (time <= timeLimit && time > max) {
                    max = time;
                    finalArray = [numSets, numReps, max];
                    found = true;
                }
            }
        }
        if (!found) {
            numExercises -= 1;
            if (numExercises <= 0) break;
            timeLimit = Math.floor(durationInSeconds / numExercises);
        }
    }

    if (!found) return []; // Ritorna un array vuoto come safety per evitare errori a cascata

    return [...finalArray, numExercises]; // [sets, reps, maxtime, numExercises]
}




export function GenerateExercises(
    split: string[],
    exercises: WgerExercise[],
    userEquipment: string[],
    goal: Goal,
    sessionDuration: number,
    sessionsPerWeek: number
): WorkoutPlan[] {
    const workout: WorkoutPlan[] = [];
    const params = GOAL_PARAMS[goal];

    const cardioTime = Math.floor((sessionDuration * params.cardioPercentage) / 100);
    const exTime = sessionDuration - cardioTime;

    const exe = setNumExercises(goal, exTime, sessionsPerWeek);


    // Memoria globale per non ripetere lo stesso esercizio nella stessa settimana
    const weeklyUsedExercises = new Set<number>();

    for (let i = 0; i < split.length; i++) {
        const constraint = CONSTRAINTS[split[i]];
        const userExercises: WgerExercise[] = [];

        // definisco muscoli con priorità vengono aggiunti
        const plannedMuscles: string[] = [];
        for (const priorityMuscle of constraint.PriorityMuscles) {
            plannedMuscles.push(priorityMuscle);
        }

        // FIX: Recupera il numero di esercizi dalla lunghezza dell'array prodotto
        const currentExe = exe[i] || [];
        const numExercises = Math.max(0, currentExe.length - 1);
        const remainingSlots = numExercises - plannedMuscles.length;

        if (remainingSlots > 0) {
            const secondaryPool = (constraint.secondaryMuscles && constraint.secondaryMuscles.length > 0)
                ? constraint.secondaryMuscles
                : constraint.PriorityMuscles;

            for (let j = 0; j < remainingSlots; j++) {
                plannedMuscles.push(secondaryPool[j % secondaryPool.length]);
            }
        }

        // seleziono gli esercizi
        for (const muscle of plannedMuscles) {
            const currentMuscle = muscle.toLowerCase();

            let candidates = exercises.filter(ex => {
                const main = (ex.muscleGroupArray || "").map(m => m.name_en.toLowerCase());
                const cat = (ex.category || "").toLowerCase();
                const sec = (ex.secondaryMuscleGroup || []).map(m => m.name_en.toLowerCase());
                return (main.includes(currentMuscle) || cat === currentMuscle || sec.includes(currentMuscle)) && ((ex.category || "").toLowerCase() !== "cardio") && (!ex.name.includes("stretch"));
            });

            candidates = filterByEquipment(candidates, userEquipment);
            const exercise = pickExercise(candidates, weeklyUsedExercises);

            if (exercise) {
                userExercises.push(exercise);
            } else {
                // Fallback estremo se non ci sono esercizi specifici per quel muscolo con l'attrezzatura dell'utente
                const globalCandidates = filterByEquipment(exercises, userEquipment);
                // FIX: Evita di pescare cardio nella sezione pesi
                const globalNonCardio = globalCandidates.filter(e => (e.category || "").toLowerCase() !== "cardio");
                const fallbackEx = pickExercise(globalNonCardio, weeklyUsedExercises);
                if (fallbackEx) userExercises.push(fallbackEx);
            }
        }

        workout.push({ workout: userExercises, sets: currentExe });
    }

    // Aggiunta Cardio
    if (cardioTime > 0) {
        let cardioCandidates = exercises.filter(ex => (ex.category || "").toLowerCase() === "cardio");
        cardioCandidates = filterByEquipment(cardioCandidates, userEquipment);

        if (cardioCandidates.length > 0) {
            for (let i = 0; i < workout.length; i++) {
                const sessionCardioUsed = new Set<number>();
                const cardioEx = pickExercise(cardioCandidates, sessionCardioUsed);
                if (cardioEx) {
                    workout[i].workout.push(cardioEx);
                    workout[i].sets.push(cardioTime);
                }
            }
        }
    }

    return workout;
}