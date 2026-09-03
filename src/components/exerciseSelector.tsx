import { useMemo, useState } from 'react';
import type { ExerciseSelectorProps } from '../types';
import { SelectorCard } from './selectorCard';
import styles from './exerciseSelector.module.css';
import { useExercise } from '../contexts/exerciseContext';
import { matchesMuscle, matchesEquipment } from '../assets/workoutGenerator';

// lista di equipaggiamenti disponibili:
const EQUIPMENT_LIST = [
    "Barbell", "Bench", "Cable machine", "Dumbbell", "Gym mat", "Incline bench",
    "Kettlebell", "Pull-up bar", "Resistance band", "SZ-Bar", "Swiss Ball",
    "none (bodyweight exercise)",
];

// muscoli disponibili
const MUSCLE_OPTIONS = [
    { value: "chest", label: "Chest" },
    { value: "back", label: "Back" },
    { value: "legs", label: "Legs" },
    { value: "shoulders", label: "Shoulders" },
    { value: "biceps", label: "Biceps" },
    { value: "triceps", label: "Triceps" },
    { value: "calves", label: "Calves" },
    { value: "glutes", label: "Glutes" },
    { value: "abs", label: "Abs" },
];

// mostro massimo 30 risultati
const MAX_RESULTS = 30;

export const ExerciseSelector = ({ documentId, onClose, onAdded }: ExerciseSelectorProps) => {
    const { exercises, loading } = useExercise();

    const [search, setSearch] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [muscle, setMuscle] = useState("");
    const [equipment, setEquipment] = useState<string[]>([]);

    // filtro i risultati 
    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();

        return exercises.filter((exercise) => {
            if (query && !exercise.name.toLowerCase().includes(query)) return false;

            if (muscle && matchesMuscle(exercise, muscle) === null) return false;

            if (equipment.length > 0 && !matchesEquipment(exercise, equipment)) return false;

            return true;
        });
    }, [exercises, search, muscle, equipment]);

    const visible = filtered.slice(0, MAX_RESULTS); // mostro 30 risultati massimo

    const toggleEquipment = (value: string, checked: boolean) => {
        setEquipment(prev =>
            checked ? [...prev, value] : prev.filter(v => v !== value)
        );
    };

    const resetFilters = () => {
        setMuscle("");
        setEquipment([]);
    };

    const hasFilters = muscle !== "" || equipment.length > 0;

    return (
        <div
            className={styles.container}
            onClick={onClose}
            role="presentation"
        >
            <div
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-label="Add exercise"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.header}>
                    <input
                        className={styles.searchInput}
                        type="text"
                        placeholder="Search exercise..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />

                    <div className={styles.headerActions}>
                        <button onClick={() => setShowFilters(prev => !prev)}>
                            {showFilters ? "Hide filters" : "Filter"}
                            {hasFilters && !showFilters ? " ●" : ""}
                        </button>

                        <button onClick={onClose}>Close</button>
                    </div>
                </div>

                {/* filtri  */}

                {showFilters && (
                    <div className={styles.filters}>
                        <select value={muscle} onChange={(e) => setMuscle(e.target.value)}>
                            <option value="">All muscles</option>
                            {MUSCLE_OPTIONS.map(({ value, label }) => (
                                <option value={value} key={value}>{label}</option>
                            ))}
                        </select>

                        <div className={styles.section}>
                            <h2>Equipment</h2>

                            <div className={styles.equipmentGrid}>
                                {[...EQUIPMENT_LIST, "gym"].map((eq) => (
                                    <div className={styles.equipmentItem} key={eq}>
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={equipment.includes(eq)}
                                                onChange={(e) => toggleEquipment(eq, e.target.checked)}
                                            />
                                            {eq === "gym" ? "Gym" : eq}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.headerActions}>
                            <button onClick={resetFilters} disabled={!hasFilters}>
                                Reset
                            </button>
                            <button onClick={() => setShowFilters(false)}>
                                Show results
                            </button>
                        </div>
                    </div>
                )}

                {loading && <div className={styles.loader}>Loading exercises...</div>}

                {!loading && !showFilters && (
                    <>
                        <div className={styles.exerciseList}>
                            {visible.map((exercise) => (
                                <SelectorCard
                                    key={exercise.exerciseSourceId}
                                    exercise={exercise}
                                    documentId={documentId}
                                    onAdded={onAdded}
                                />
                            ))}
                        </div>

                        {filtered.length === 0 && (
                            <p className={styles.hint}>
                                No exercise matches your search.
                            </p>
                        )}

                        {filtered.length > MAX_RESULTS && (
                            <p className={styles.hint}>
                                Showing {MAX_RESULTS} of {filtered.length} — refine your search.
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
