import styles from './workoutCard.module.css';
import type { WorkoutCardProps } from '../types';
import { useNavigate } from 'react-router-dom';

export const WorkoutCard = ({ id, name, exerciseCount, volume }: WorkoutCardProps) => {

    const navigate = useNavigate();

    return (
        <div className={styles.card} key={id} onClick={() => navigate(`/editWorkout/${id}`)}>

            <h2 className={styles.title}>
                {name}
            </h2>

            <div className={styles.stats}>

                <div className={styles.stat}>
                    <span className={styles.label}>
                        Volume
                    </span>
                    <span className={styles.value}>
                        {volume} kg
                    </span>
                </div>


                <div className={styles.stat}>
                    <span className={styles.label}>
                        Esercizi
                    </span>
                    <span className={styles.value}>
                        {exerciseCount}
                    </span>
                </div>

            </div>

        </div>
    );


}