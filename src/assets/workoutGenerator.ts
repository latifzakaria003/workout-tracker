import type { GoalParams, WgerExercise, ConstraintProps, Goal, WorkoutPlan, PlannedExercise, VolumeChoice } from '../types';

// [x, y] è il range
export const GOAL_PARAMS: Record<Goal, GoalParams> = {
    "strength": { sets: [3, 5], reps: [3, 6], rest: 180, cardioPercentage: 0, timePerRep: 5 },
    "hypertrophy": { sets: [3, 4], reps: [8, 12], rest: 90, cardioPercentage: 0, timePerRep: 4 },
    "endurance": { sets: [2, 3], reps: [15, 20], rest: 45, cardioPercentage: 20, timePerRep: 3 },
    "weight loss": { sets: [3, 4], reps: [10, 15], rest: 60, cardioPercentage: 30, timePerRep: 4 },
    "general fitness": { sets: [3, 4], reps: [8, 12], rest: 60, cardioPercentage: 10, timePerRep: 4 },
};

const OVERHEAD_SECONDS = 300; // 5 minuti per pause generali (spostarsi da un macchinario ad un altro, bere, andare in bagno, ...)
const MAX_EXERCISES_PER_SESSION = 8; // non supero gli 8 esercizi per workout

// vincoli per workout
const CONSTRAINTS: Record<string, ConstraintProps> = {
    "full body": {
        minNumOfExercises: 3,   // numero minimo di esercizi
        priorityMuscles: ["Chest", "Back", "Legs"], // gruppi muscolari prioritari
        secondaryMuscles: ["Biceps", "Triceps", "Shoulders", "Calves", "Abs"] // gruppi muscolari che non hanno massima priorità
    },
    "upper": {
        minNumOfExercises: 2,
        priorityMuscles: ["Chest", "Back"],
        secondaryMuscles: ["Shoulders", "Biceps", "Triceps"]
    },
    "lower": {
        minNumOfExercises: 1,
        priorityMuscles: ["Legs"],
        secondaryMuscles: ["Calves", "Glutes", "Abs"]
    },
    "push": {
        minNumOfExercises: 2,
        priorityMuscles: ["Chest"],
        secondaryMuscles: ["Shoulders", "Triceps"]
    },
    "pull": {
        minNumOfExercises: 2,
        priorityMuscles: ["Back"],
        secondaryMuscles: ["Biceps", "Rear Delts"]
    },
    "legs": {
        minNumOfExercises: 1,
        priorityMuscles: ["Legs"],
        secondaryMuscles: ["Calves", "Glutes"]
    }
};

// alias spesso usati dall'api wger
const MUSCLE_ALIASES: Record<string, string[]> = {
    "chest": ["chest", "pectoralis"],
    "back": ["back", "latissimus", "trapezius", "erector spinae", "rhomboid"],
    "legs": ["legs", "quadriceps", "hamstring", "biceps femoris", "adductor"],
    "shoulders": ["shoulders", "deltoid"],
    "rear delts": ["shoulders", "deltoid", "trapezius"],
    "biceps": ["arms", "biceps brachii", "brachialis"],
    "triceps": ["arms", "triceps brachii"],
    "calves": ["calves", "gastrocnemius", "soleus"],
    "glutes": ["legs", "gluteus"],
    "abs": ["abs", "rectus abdominis", "obliquus"],
};

// controlla se l'esercizio è cardio
const isCardio = (exercise: WgerExercise): boolean =>
    (exercise.category || "").toLowerCase() === "cardio";


// sceglie la split in base al numero di allenamenti che l'utente può fare a settimana
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

// controlla se l'utente ha l'equipaggiamento necessario per fare l'esercizio
export function matchesEquipment(exercise: WgerExercise, userEquipment: string[]): boolean {

    if (userEquipment.includes("gym")) return true; // siamo in palestra, abbiamo ogni tipo di equipaggiamento

    const needed = exercise.equipment ?? [];

    if (needed.length === 0) return false; // molti esercizi su wger hanno equipaggiamento nonostante abbiano il campo equipment vuoto

    return needed.some(eq => userEquipment.includes(eq));
}

// controlla se l'esercizio allena il muscolo che vogliamo allenare e la priorità
export function matchesMuscle(exercise: WgerExercise, muscle: string): "primary" | "secondary" | null {
    const target = muscle.toLowerCase();
    const aliases = MUSCLE_ALIASES[target] ?? [target];

    // controlla l'alias combaci
    const hit = (values: string[]) =>
        values.some(value => aliases.some(alias => value.includes(alias)));

    const primaryNames = (exercise.muscleGroupArray ?? []).map(m => m.name_en.toLowerCase());
    if (hit(primaryNames)) return "primary";

    const secondaryNames = (exercise.secondaryMuscleGroup ?? []).map(m => m.name_en.toLowerCase());
    if (hit(secondaryNames)) return "secondary";

    // fallback: uso la categoria per i dati dove non è specificato muscolo
    const category = (exercise.category || "").toLowerCase();
    if (hit([category])) return "secondary";

    return null;
}

// trova gli esercizi compatibili
function getCandidates(
    exercises: WgerExercise[],
    muscle: string,
    userEquipment: string[]
): WgerExercise[] {
    const primary: WgerExercise[] = [];
    const secondary: WgerExercise[] = [];

    for (const exercise of exercises) {
        if (isCardio(exercise)) continue;   // è cardio
        if (!matchesEquipment(exercise, userEquipment)) continue; // non ho equipaggiamento necessario

        const match = matchesMuscle(exercise, muscle);
        if (match === "primary") primary.push(exercise);
        else if (match === "secondary") secondary.push(exercise);
    }
    return primary.length > 0 ? primary : secondary; // se nessun esercizio allena i muscoli con priorità ci arrangiamo di quelli con priorità minore
}

// sceglie un esercizio a caso tra i candidati
function pickExercise(candidates: WgerExercise[], used: Set<number>): WgerExercise | null {
    if (candidates.length === 0) return null;

    const available = candidates.filter(e => !used.has(e.exerciseSourceId));  // provo a non ripetere i soliti esercizi
    const pool = available.length > 0 ? available : candidates; // se non riesco mi accontento

    const favorite = pool.filter(e => !e.equipment.includes("none (bodyweight exercise)")) // provo a prioritizzare quelli non a corpo libero
    const favoritePool = favorite.length > 0 ? favorite : pool // se non riesco mi accontento

    const filteredPool = favoritePool.filter(e => e.imageUrl) // provo a prioritizzare quelli con un immagine
    const finalPool = filteredPool.length > 0 ? filteredPool : favoritePool; // se non riesco mi accontento

    const chosen = finalPool[Math.floor(Math.random() * finalPool.length)];
    used.add(chosen.exerciseSourceId);

    return { ...chosen };
}

// sceglie la miglior combinazione di ripetizioni e serie senza andare fuori tempo
function chooseCombination(params: GoalParams, secondsPerExercise: number): VolumeChoice | null {
    let best: VolumeChoice | null = null;
    for (let sets = params.sets[0]; sets <= params.sets[1]; sets++) {
        for (let reps = params.reps[0]; reps <= params.reps[1]; reps++) {
            const seconds = sets * (reps * params.timePerRep + params.rest); // tempo totale per esercizio
            if (seconds > secondsPerExercise) continue; // supera il tempo disponibile
            if (best && seconds < best.secondsPerExercise) continue; // è peggio dello scorso tempo migliore

            best = { sets, reps, secondsPerExercise: seconds }; // è la combinazione migliore
        }
    }
    return best;
}

// distribuisce il numero di serie su tutti gli esercizi
function distributeSets(totalSets: number, exerciseCount: number): number[] {
    const count = Math.min(exerciseCount, totalSets); // evito di creare più esercizi rispetto alle serie disponibili
    if (count <= 0) return [];

    const setsPerExercise = Math.floor(totalSets / count);  // serie che possiamo fare per esercizio
    const setsLeft = totalSets % count;    // serie che possiamo aggiungere

    return Array.from({ length: count }, (_, i) => setsPerExercise + (i < setsLeft ? 1 : 0)); // assegniamo le serie partendo dalla testa 
}

// scelgie quanti esercizi mettere in un workout
export function planExercise(
    params: GoalParams,
    availableSeconds: number,
    constraint: ConstraintProps
): { setsPerExercise: number[]; reps: number } | null {
    if (availableSeconds <= 0) return null;

    let best: { count: number; volume: VolumeChoice } | null = null;

    // provo aggiungendo esercizi
    for (let count = constraint.minNumOfExercises; count <= MAX_EXERCISES_PER_SESSION; count++) {
        const volume = chooseCombination(params, availableSeconds / count);
        if (!volume) break;   // se count non entra non ha senso andare avanti

        best = { count, volume };
    }

    // se non ho trovato nulla provo togliendo esercizi
    if (!best) {
        for (let count = constraint.minNumOfExercises - 1; count >= 1; count--) {
            const volume = chooseCombination(params, availableSeconds / count);
            if (volume) {
                best = { count, volume };
                break; // se trovo qualcosa non ha senso continuare a provare con meno esercizi
            }
        }
    }

    if (!best) return null;

    return {
        setsPerExercise: distributeSets(best.count * best.volume.sets, best.count), // distribuisco le serie tra gli esercizi
        reps: best.volume.reps,
    };
}

// sceglie il muscolo da allenare
function planMuscles(constraint: ConstraintProps, slots: number): string[] {
    const muscles = constraint.priorityMuscles.slice(0, slots);

    const pool = constraint.secondaryMuscles?.length
        ? constraint.secondaryMuscles
        : constraint.priorityMuscles;

    if (pool.length == 0) return muscles;

    // aggiungiamo i muscoli secondari se ci sono, altrimenti ripetiamo i primari
    for (let i = muscles.length; i < slots; i++) {
        muscles.push(pool[(i - constraint.priorityMuscles.length) % pool.length]);
    }

    return muscles;
}

// genera l'esercizio
export function generateExercises(
    split: string[],
    exercises: WgerExercise[],
    userEquipment: string[],
    goal: Goal,
    sessionDuration: number
): WorkoutPlan[] {
    const params = GOAL_PARAMS[goal];

    // tempo usato per i cardio
    const cardioMinutes = Math.floor((sessionDuration * params.cardioPercentage) / 100);
    // tempo usato per esercizi con pesi (se l'allenamento dura 30 minuti ignoro l'OVERHEAD)
    const weightsSeconds = sessionDuration == 30 ? (sessionDuration - cardioMinutes) * 60 : (sessionDuration - cardioMinutes) * 60 - OVERHEAD_SECONDS;

    // memoria settimanale per non ripetere i soliti esercizi
    const usedThisWeek = new Set<number>();
    const usedCardio = new Set<number>();

    const cardioPool = exercises.filter(e => isCardio(e) && matchesEquipment(e, userEquipment));

    const plans: WorkoutPlan[] = [];

    for (const day of split) {
        const constraint = CONSTRAINTS[day];
        const sets = planExercise(params, weightsSeconds, constraint);

        const planned: PlannedExercise[] = [];

        // Pesi
        if (sets) {
            const muscles = planMuscles(constraint, sets.setsPerExercise.length);

            // filtriamo i muscoli
            muscles.forEach((muscle, index) => {
                let chosen = pickExercise(
                    getCandidates(exercises, muscle, userEquipment),
                    usedThisWeek
                );

                // fallback: scelgo un esercizio a caso 
                if (!chosen) {
                    const anyWeights = exercises.filter(
                        e => !isCardio(e) && matchesEquipment(e, userEquipment)
                    );
                    chosen = pickExercise(anyWeights, usedThisWeek);
                }
                // aggiungo l'esercizio al workout
                if (chosen) {
                    planned.push({
                        exercise: chosen,
                        sets: sets.setsPerExercise[index],
                        reps: sets.reps,
                        isCardio: false,
                    });
                }
            });
        }

        // Cardio
        if (cardioMinutes > 0) {
            const chosen = pickExercise(cardioPool, usedCardio);

            if (chosen) {
                planned.push({
                    exercise: chosen,
                    sets: 1,
                    reps: cardioMinutes,
                    isCardio: true,
                });
            }
        }

        plans.push({ split: day, exercises: planned });
    }

    return plans;
}

// funzione che passo alla pagina workoutGeneration
export const generateWorkout = (
    exercises: WgerExercise[],
    sessionsPerWeek: number,
    sessionDuration: number,
    goal: Goal,
    userEquipment: string[]
): WorkoutPlan[] => {
    const split = getSplit(sessionsPerWeek);
    return generateExercises(split, exercises, userEquipment, goal, sessionDuration);
};