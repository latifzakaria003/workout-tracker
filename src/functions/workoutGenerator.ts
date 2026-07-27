import type { GoalParams, WgerExercise, ConstraintProps, Goal, WorkoutPlan } from '../types';

// ===== Tipi =====


// ===== Parametri per goal (sostituisce lo switch, niente più default mancante) =====

export const GOAL_PARAMS: Record<Goal, GoalParams> = {
    "strength": { sets: [3, 5], reps: [3, 6], rest: 180, cardioPercentage: 0, timePerRep: 5 },
    "hypertrophy": { sets: [3, 4], reps: [8, 12], rest: 90, cardioPercentage: 0, timePerRep: 4 },
    "endurance": { sets: [2, 3], reps: [15, 20], rest: 45, cardioPercentage: 20, timePerRep: 3 },
    "weight loss": { sets: [3, 4], reps: [10, 15], rest: 60, cardioPercentage: 40, timePerRep: 4 },
    "general fitness": { sets: [3, 3], reps: [10, 15], rest: 60, cardioPercentage: 10, timePerRep: 4 },
};


// function isValidGoal(goal: string): goal is Goal {
//     return goal in GOAL_PARAMS;
// }

// ===== Sets/reps e conteggio esercizi in base al tempo disponibile =====

// function pickSetsAndReps(params: GoalParams, split: string[]): { sets: number; reps: number } {

//     const sets = split.includes("full body") ? params.sets[0] : Math.floor(Math.random() * ((params.sets[1] - params.sets[0] + 1))) + params.sets[0];

//     const reps = split.includes("full body") ? params.reps[0] : Math.floor(Math.random() * (params.reps[1] - params.reps[0] + 1)) + params.reps[0];
//     return { sets, reps };
// }

// function estimateExerciseTime(sets: number, reps: number, params: GoalParams): number {
//     const timePerSet = params.timePerRep * reps;
//     return (timePerSet + params.rest) * sets; // secondi per UN esercizio
// }

// function estimateExerciseCount(sessionsDurationMinutes: number, timePerExercise: number): number {
//     const sessionsDurationSeconds = sessionsDurationMinutes * 60;
//     return Math.max(Math.floor(sessionsDurationSeconds / timePerExercise), 1) - 5; // the minus 5 is to consider all type of breaks that migth exceed the resting time (bathroom, putting weights on machine, drinking, talking, ...)
// }

// ===== Split settimanale (niente più duplicati, case 4 esplicito) =====

function getSplit(sessionsPerWeek: number): string[] {
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

// ===== Mapping giorno -> categorie wger =====

// const SPLIT_TO_CATEGORIES: Record<string, string[]> = {
//     "full body": ["Chest", "Back", "Legs", "Calves", "Shoulders", "Arms", "Abs"],
//     "upper": ["Chest", "Back", "Shoulders", "Arms"],
//     "lower": ["Legs", "Calves", "Glutes"],
//     "push": ["Chest", "Shoulders", "Triceps"],
//     "pull": ["Back", "Shoulders", "Biceps"],
//     "legs": ["Legs", "Calves", "Glutes"],
//     "chest": ["Chest"],
//     "back": ["Back"],
//     "shoulders": ["Shoulders"],
//     "arms": ["Triceps, Biceps"],
//     "abs": ["Abs"],
// };

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
}

function generateNumExercises(goal: Goal, sessionDuration: number) {
    const sessionDurationSeconds = sessionDuration * 60;
    const cardioTime = (sessionDurationSeconds / 100 * GOAL_PARAMS[goal].cardioPercentage); // in seconds

    const exercisesTime = sessionDurationSeconds - cardioTime; // in seconds
    const timePerRep = GOAL_PARAMS[goal].timePerRep;
    const numSets = GOAL_PARAMS[goal].sets[0];
    const numReps = GOAL_PARAMS[goal].reps[0];

    const timePerSet = timePerRep * numReps;


    const timePerExercise = numSets * (timePerSet + GOAL_PARAMS[goal].rest); // in seconds


    const numExercises = Math.floor(exercisesTime / timePerExercise)


    const numCardioExercises = Math.floor(cardioTime / timePerExercise);

    return [numExercises, numCardioExercises];
}

// split è l'array che contiene la spilt della settimana, numExercises è il numero di esercizi per split
// sets è il numero di sets per esercizio, exercises è la lista completa di esercizi
function GenerateExercises(split: string[], numEx: number[], sets: number, exercises: WgerExercise[], userEquipment: string[]) {

    const workout: WorkoutPlan[] = []; // array di array di esercizi, conterrà le liste degli esercizi
    let numExercises = numEx[0];    // number of exercises that are not cardio
    let numCardio = numEx[1];       // number of exercises that ARE cardio

    for (let i = 0; i < split.length; i++) {
        let exercisesLeft = numExercises;
        const userExercises: WgerExercise[] = []; // array che conterrà gli esercizi di uno specifico giorno 
        const count = CONSTRAINTS[split[i]].minNumOfExercises; // numero di esercizi con priorità
        if (numExercises >= count) {
            // posso fare tutti gli esercizi che prioritizzo + forse altri
            const exercisesToPrioritize = numExercises - count; // numero di esercizi che posso prioritizzare
            if (exercisesToPrioritize > CONSTRAINTS[split[i]].secondaryMuscles.length) {
                // posso prioritizzare tutti gli esercizi
                const tempPriorityMuscles = [...CONSTRAINTS[split[i]].PriorityMuscles, ...CONSTRAINTS[split[i]].secondaryMuscles]; // metto tutte le categorie di esercizi nell'array
                let x = 0;

                for (let k = 0; k < numExercises; k++) {
                    // aggiungiamo tutti gli esercizi possibili al workout
                    let muscles = exercises.filter((exercise) => (exercise.muscleGroup === tempPriorityMuscles[x]) || (exercise.category === tempPriorityMuscles[x]));
                    if (muscles.length == 0) {
                        muscles = exercises.filter((exercise) => exercise.secondaryMuscleGroup.includes(tempPriorityMuscles[x]));
                    }

                    const FilteredMuscles = muscles.filter((exercise) => {

                        for (const ele of userEquipment) {
                            if (exercise.equipment.includes(ele))
                                return true;
                        };
                        if (userEquipment.includes("gym"))
                            return true;
                    })
                    console.log("lunghezza filtrata: ", FilteredMuscles.length)
                    const randomIdx = Math.floor(Math.random() * (FilteredMuscles.length));
                    userExercises.push(FilteredMuscles[randomIdx]);
                    console.log("prima pushata ", {
                        muscle: tempPriorityMuscles[x],
                        found: muscles.length,
                        randomIdx
                    });
                    x = (x + 1) % count;
                }
                workout.push({ workout: userExercises, sets: sets });
            } else {
                // non posso prioritizzare tutti gli esercizi
                const tempPriorityMuscles = [...CONSTRAINTS[split[i]].PriorityMuscles];
                for (let j = 0; j < exercisesToPrioritize; j++) {
                    tempPriorityMuscles.push(CONSTRAINTS[split[i]].secondaryMuscles[j]); // prioritizzo finché posso
                }
                const tempSecondaryMuscles = CONSTRAINTS[split[i]].secondaryMuscles.slice(exercisesToPrioritize); // esercizi che non posso prioritizzare

                const lenPriority = CONSTRAINTS[split[i]].PriorityMuscles.length;
                const lenSecondary = CONSTRAINTS[split[i]].secondaryMuscles.length;

                while (exercisesLeft > 0) {
                    for (let j = 0; j < lenPriority; j++) {
                        let added = false;
                        let k = 0;
                        // ottengo gli esercizi che posso fare
                        let muscleGroup = exercises.filter((exercise) => (exercise.muscleGroup === tempPriorityMuscles[j]) || (exercise.category === tempPriorityMuscles[j]))
                        while (k < lenSecondary) {
                            if (tempSecondaryMuscles[k] === "added") {
                                k++;
                                continue;   // exercise already added
                            }
                            const muscles = muscleGroup.filter((exercise) => exercise.secondaryMuscleGroup.includes(tempSecondaryMuscles[k]))
                            if (muscles.length > 0) {
                                const FilteredMuscles = muscles.filter((exercise) => {
                                    for (const ele of userEquipment) {
                                        if (exercise.equipment.includes(ele))
                                            return true;
                                    };
                                    if (userEquipment.includes("gym"))
                                        return true;
                                })
                                console.log("lunghezza filtrata: ", FilteredMuscles.length)
                                // aggiungo l'esercizio che include uno di quelli con priorità inferiore
                                const randomIdx = Math.floor(Math.random() * (FilteredMuscles.length));
                                userExercises.push(FilteredMuscles[randomIdx]);
                                console.log("seconda pushata ", {
                                    muscle: tempPriorityMuscles[j],
                                    found: muscleGroup.length,
                                    randomIdx
                                });
                                tempSecondaryMuscles[k] = "added";
                                added = true;
                                exercisesLeft -= 1;
                                break;
                            } else {
                                // aggiungo uno a caso con priorità
                                if (muscleGroup.length == 0) {
                                    muscleGroup = exercises.filter((exercise) => exercise.secondaryMuscleGroup.includes(tempPriorityMuscles[j]));
                                }
                                const FilteredMuscles = muscleGroup.filter((exercise) => {
                                    for (const ele of userEquipment) {
                                        if (exercise.equipment.includes(ele))
                                            return true;
                                    };
                                    if (userEquipment.includes("gym"))
                                        return true;
                                })
                                console.log("lunghezza filtrata: ", FilteredMuscles.length)
                                const randomIdx = Math.floor(Math.random() * (FilteredMuscles.length));
                                userExercises.push(FilteredMuscles[randomIdx]);
                                console.log("terza pushata : ", {
                                    muscle: tempPriorityMuscles[j],
                                    found: muscleGroup.length,
                                    randomIdx
                                });
                                added = true;
                                exercisesLeft -= 1;
                                break;
                            }
                        }
                        if (!added) {
                            if (muscleGroup.length == 0) {
                                muscleGroup = exercises.filter((exercise) => exercise.secondaryMuscleGroup.includes(tempPriorityMuscles[j]));
                            }
                            const FilteredMuscles = muscleGroup.filter((exercise) => {
                                for (const ele of userEquipment) {
                                    if (exercise.equipment.includes(ele))
                                        return true;
                                };
                                if (userEquipment.includes("gym"))
                                    return true;
                            })
                            console.log("lunghezza filtrata: ", FilteredMuscles.length)
                            const randomIdx = Math.floor(Math.random() * (FilteredMuscles.length));
                            userExercises.push(FilteredMuscles[randomIdx]);
                            console.log({
                                muscle: tempPriorityMuscles[j],
                                found: muscleGroup.length,
                                randomIdx
                            });
                        }
                    }
                }
                workout.push({ workout: userExercises, sets: sets });

            }
        } else {
            // numExercises < prioritizeList
            const numSets = numExercises * sets; // numero di sets totali
            let newSet = 0; // gli esercizi infondo avranno questo numero di set

            while (newSet < (sets - 1)) {
                newSet += 1;
            }
            numExercises = numExercises + 1;
            const finalSet = (numSets - newSet) / numExercises;

            sets = Math.floor(finalSet);
            i -= 1; // repeat the cycle
        }
    }
    while (numCardio > 0) {
        const cardioExercises = exercises.filter((exercise) => exercise.category == "Cardio")
        const FilteredMuscles = cardioExercises.filter((exercise) => {
            for (const ele of userEquipment) {
                if (exercise.equipment.includes(ele))
                    return true;
            };
            if (userEquipment.includes("gym"))
                return true;

        })
        console.log("lunghezza filtrata: ", FilteredMuscles.length)
        for (let i = 0; i < workout.length; i++) {
            const randomIdx = Math.floor(Math.random() * (cardioExercises.length))
            workout[i].workout.push(FilteredMuscles[randomIdx]);
        }
        numCardio -= 1;
    }
    return workout;
}




// ===== Filtro equipment =====

// function isEquipmentAvailable(exerciseEquipment: string[], userEquipment: string[]): boolean {
//     if (exerciseEquipment.length === 0) return true; // corpo libero, sempre ok
//     return exerciseEquipment.every((eq) => userEquipment.includes(eq));
// }

// // ===== Distribuzione esercizi tra le categorie del giorno =====

// function distributeAcrossCategories(categories: string[], totalCount: number): Record<string, number> {
//     const distribution: Record<string, number> = {};
//     const base = Math.floor(totalCount / categories.length);
//     let remainder = totalCount % categories.length;

//     categories.forEach((cat) => {
//         distribution[cat] = base + (remainder > 0 ? 1 : 0);
//         if (remainder > 0) remainder--;
//     });

//     return distribution;
// }

// ===== Selezione esercizi per un giorno =====

// function pickExercisesForDay(
//     day: string,
//     exerciseCount: number,
//     exercisePool: WgerExercise[],
//     userEquipment: string[],
//     cardioPercentage: number
// ): WgerExercise[] {
//     const cardioCount = Math.round((exerciseCount * cardioPercentage) / 100);
//     const strengthCount = exerciseCount - cardioCount;

//     const categories = SPLIT_TO_CATEGORIES[day] ?? [day];
//     const distribution = distributeAcrossCategories(categories, strengthCount);
//     const selected: WgerExercise[] = [];

//     for (const category of categories) {
//         const available = exercisePool.filter(
//             (ex) =>
//                 ex.category.toLowerCase() === category.toLowerCase() &&
//                 isEquipmentAvailable(ex.equipment, userEquipment)
//         );
//         const shuffled = [...available].sort(() => Math.random() - 0.5);
//         selected.push(...shuffled.slice(0, distribution[category] ?? 0));
//     }

//     if (cardioCount > 0) {
//         const cardioAvailable = exercisePool.filter(
//             (ex) =>
//                 ex.category.toLowerCase() === "cardio" &&
//                 isEquipmentAvailable(ex.equipment, userEquipment)
//         );
//         const shuffled = [...cardioAvailable].sort(() => Math.random() - 0.5);
//         selected.push(...shuffled.slice(0, cardioCount));
//     }

//     return selected;
// }

// ===== Funzione principale =====

// export const generateWorkoutPlan = (
//     props: ExerciseGenerationProps,
//     exercisePool: WgerExercise[]
// ): WorkoutSession[] => {
//     if (!isValidGoal(props.goal)) {
//         throw new Error(`Goal non valido: ${props.goal}`);
//     }
//     const params = GOAL_PARAMS[props.goal];
//     const split = getSplit(props.sessionsPerWeek);


//     const { sets, reps } = pickSetsAndReps(params, split);
//     const timePerExercise = estimateExerciseTime(sets, reps, params); // 400
//     const exerciseCount = estimateExerciseCount(props.sessionsDuration, timePerExercise);


//     return split.map((day) => ({
//         day,
//         sets,
//         reps,
//         rest: params.rest,
//         exercises: pickExercisesForDay(day, exerciseCount, exercisePool, props.equipment, params.cardioPercentage),
//     }));
// }

export const GenerateWorkout = (exercises: WgerExercise[], sessionsPerWeek: number, sessionDuration: number, goal: Goal, userEquipment: string[]) => {

    const sets = GOAL_PARAMS[goal].sets[1];

    const split = getSplit(sessionsPerWeek);

    const workout = GenerateExercises(split, generateNumExercises(goal, sessionDuration), sets, exercises, userEquipment);

    return workout;
}