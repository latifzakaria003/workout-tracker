import styles from "./ExerciseCard.module.css";
import type { Exercises } from "../types";


export const ExerciseCard = ({
    exerciseName,
    exerciseOrder,
    exerciseSourceId,
    imageUrl,
    muscleGroup,
    rest,
    sets
}: Exercises) => {

    return (
        <div className={styles.card} key={exerciseOrder}>

            <h1 className={styles.title}>
                {exerciseName}
            </h1>

            <img
                className={styles.image}
                src={imageUrl}
                alt="image"
            />

            <div className={styles.info}>
                <p>ID: {exerciseSourceId}</p>
                <p>Muscle: {muscleGroup}</p>
                <p>Rest: {rest}min</p>
            </div>


            <div className={styles.setsContainer}>
                {sets.map((set, index) => (
                    <div
                        className={styles.set}
                        key={index}
                    >
                        <span className={styles.setLabel}>
                            Set {index + 1}
                        </span>

                        <span className={styles.setValue}>
                            {set.weight} kg
                        </span>

                        <span className={styles.setValue}>
                            {set.reps} reps
                        </span>
                    </div>
                ))}
            </div>

        </div>
    );
};