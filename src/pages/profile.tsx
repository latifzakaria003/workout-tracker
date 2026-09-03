import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, setDoc, Timestamp, where } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { db, auth } from '../firebase/firebase';
import type { UserProfile, HistoryProps } from '../types';
import { Navbar } from '../components/navbar';
import { useNavigate } from 'react-router-dom';
import { dateKey } from '../assets/time';
import styles from './profile.module.css';


const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const mondayFirst = (day: number) => (day + 6) % 7; // getDay() mette domenica in posizione 0 quindi shifto per avere lunedi come primo

const emptyProfile: UserProfile = {
    heightCm: null,
    weightKg: null,
    birthDate: "",
    experience: "",
    notes: "",
};

export const Profile = () => {
    const [user, userLoading] = useAuthState(auth);

    const [profile, setProfile] = useState<UserProfile>(emptyProfile);
    const [form, setForm] = useState<Record<string, string>>({}); // form con informazioni sull'utente
    const [editing, setEditing] = useState(false);  // sto editando le informazioni
    const [saving, setSaving] = useState(false);    // sto salvando le informazioni

    const [activeDays, setActiveDays] = useState<Set<string>>(new Set()); // giorni di allenamento
    const [totalWorkouts, setTotalWorkouts] = useState(0);  // numero totale di allenamenti

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const today = useMemo(() => new Date(), []);
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

    const navigate = useNavigate();


    useEffect(() => {
        if (!user) return;

        let cancelled = false; // uso per non calcolare quando la componente viene smontata

        const load = async () => {
            setLoading(true);
            setError("");

            try {
                // prendo profilo e history dell'utente
                const [profileSnap, historySnap] = await Promise.all([
                    getDoc(doc(db, "users", user.uid)),
                    getDocs(query(
                        collection(db, "workoutsHistory"),
                        where("userId", "==", user.uid)
                    )),
                ]);

                if (cancelled) return; // la componente è stata smontata, non continuo

                const loaded = profileSnap.exists()
                    ? { ...emptyProfile, ...(profileSnap.data() as UserProfile) }
                    : emptyProfile;

                setProfile(loaded); // carico il profilo dell'utente
                setEditing(!profileSnap.exists()); // form in editing se il profilo non è mai stato riempito

                // recupero giorni in cui l'utente si è allenato
                const days = new Set<string>();
                historySnap.forEach((docSnap) => {
                    const data = docSnap.data() as HistoryProps;
                    if (data.date) days.add(dateKey(data.date.toDate()));
                });
                setActiveDays(days);
                setTotalWorkouts(historySnap.size);
            } catch (err) {
                if (cancelled) return;
                console.error(err);
                setError("Couldnt load your profile");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();

        return () => { cancelled = true; };
    }, [user]);

    const startEditing = () => {
        setForm({
            heightCm: profile.heightCm?.toString() ?? "",
            weightKg: profile.weightKg?.toString() ?? "",
            birthDate: profile.birthDate ?? "",
            experience: profile.experience ?? "",
            notes: profile.notes ?? "",
        });
        setEditing(true);
    };

    const saveProfile = async () => {
        if (!user || saving) return;

        setSaving(true);
        setError("");

        try {
            const height = form.heightCm?.trim() ? Number(form.heightCm) : null;
            const weight = form.weightKg?.trim() ? Number(form.weightKg) : null;

            if (height !== null && (Number.isNaN(height) || height <= 0)) {
                setError("Height must be a positive number.");
                return;
            }
            if (weight !== null && (Number.isNaN(weight) || weight <= 0)) {
                setError("Weight must be a positive number.");
                return;
            }

            const updated: UserProfile = {
                heightCm: height,
                weightKg: weight,
                birthDate: form.birthDate ?? "",
                experience: form.experience ?? "",
                notes: form.notes?.trim() ?? "",
            };

            await setDoc(
                doc(db, "users", user.uid),
                { ...updated, updatedAt: Timestamp.now() }
            );

            setProfile(updated);
            setEditing(false);
        } catch (err) {
            console.error(err);
            setError("Could not save your profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    // calcolo dell'età
    const age = useMemo(() => {
        if (!profile.birthDate) return null;

        const born = new Date(profile.birthDate);
        if (Number.isNaN(born.getTime())) return null;

        let years = today.getFullYear() - born.getFullYear();
        const monthDiff = today.getMonth() - born.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < born.getDate())) years--;

        return years >= 0 ? years : null;
    }, [profile.birthDate, today]);

    // calendario
    const calendar = useMemo(() => {
        const firstDay = new Date(viewYear, viewMonth, 1); // primo giorno
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate(); // ultimo giorno del mese
        const leadingBlanks = mondayFirst(firstDay.getDay()); // numero di blocchi vuoti prima del primo giorno

        // riempio il calendario
        const cells: (number | null)[] = Array(leadingBlanks).fill(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        while (cells.length % 7 !== 0) cells.push(null);

        // mesi in cui l'utente si è allenato
        const monthActive = cells.filter(
            d => d !== null && activeDays.has(dateKey(new Date(viewYear, viewMonth, d)))
        ).length;

        return { cells, monthActive };
    }, [viewYear, viewMonth, activeDays]);

    // uso per muovermi nel calendario
    const changeMonth = (shift: number) => {
        const next = new Date(viewYear, viewMonth + shift, 1);
        setViewYear(next.getFullYear());
        setViewMonth(next.getMonth());
    };
    // mese corrente
    const monthLabel = new Date(viewYear, viewMonth, 1)
        .toLocaleDateString(undefined, { month: "long", year: "numeric" });

    // uso per non permetttere di vedere mesi futuri
    const isFuture =
        viewYear > today.getFullYear() ||
        (viewYear === today.getFullYear() && viewMonth >= today.getMonth());

    if (userLoading || loading) {
        return (
            <>
                <Navbar />
                <div className={styles.page}>
                    <p className={styles.state}>Loading…</p>
                </div>
            </>
        );
    }

    if (!user) {
        return (
            <>
                <Navbar />
                <div className={styles.page}>
                    <p className={styles.state}>You need to sign in to see your profile.</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <div className={styles.page}>
                <div className={styles.container}>

                    {/* profilo */}

                    <header className={styles.identity}>
                        <div className={styles.avatar} aria-hidden="true">
                            {(user.displayName || user.email || "?").charAt(0).toUpperCase()}
                        </div>

                        <div className={styles.identityText}>
                            <h1 className={styles.name}>
                                {user.displayName || user.email?.split("@")[0]}
                            </h1>
                            <p className={styles.email}>{user.email}</p>
                        </div>
                    </header>

                    {error && <p className={styles.error} role="alert">{error}</p>}

                    { /* informazioni personali */}

                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Personal info</h2>

                            {!editing && (
                                <button className={styles.ghostButton} onClick={startEditing}>
                                    Edit
                                </button>
                            )}
                        </div>

                        {editing ? (
                            <div className={styles.formGrid}>
                                <label className={styles.field}>
                                    <span className={styles.fieldLabel}>Height (cm)</span>
                                    <input
                                        className={styles.input}
                                        type="number"
                                        inputMode="numeric"
                                        min="10"
                                        value={form.heightCm ?? ""}
                                        onChange={(e) => setForm(p => ({ ...p, heightCm: e.target.value }))}
                                        placeholder="175"
                                    />
                                </label>

                                <label className={styles.field}>
                                    <span className={styles.fieldLabel}>Weight (kg)</span>
                                    <input
                                        className={styles.input}
                                        type="number"
                                        inputMode="decimal"
                                        min="10"
                                        value={form.weightKg ?? ""}
                                        onChange={(e) => setForm(p => ({ ...p, weightKg: e.target.value }))}
                                        placeholder="70"
                                    />
                                </label>

                                <label className={styles.field}>
                                    <span className={styles.fieldLabel}>Date of birth</span>
                                    <input
                                        className={styles.input}
                                        type="date"
                                        value={form.birthDate ?? ""}
                                        onChange={(e) => setForm(p => ({ ...p, birthDate: e.target.value }))}
                                        min="1926-08-22"
                                        max="2126-08-22"
                                    />
                                </label>

                                <label className={styles.field}>
                                    <span className={styles.fieldLabel}>Experience</span>
                                    <select
                                        className={styles.input}
                                        value={form.experience ?? ""}
                                        onChange={(e) => setForm(p => ({ ...p, experience: e.target.value }))}
                                    >
                                        <option value="">Not set</option>
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                    </select>
                                </label>

                                <label className={`${styles.field} ${styles.fieldWide}`}>
                                    <span className={styles.fieldLabel}>Notes</span>
                                    <input
                                        className={styles.input}
                                        type="text"
                                        value={form.notes ?? ""}
                                        onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
                                        placeholder="Injuries, goals, anything to remember"
                                    />
                                </label>

                                <div className={styles.formActions}>
                                    <button
                                        className={styles.ghostButton}
                                        onClick={() => { setEditing(false); setError(""); }}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className={styles.primaryButton}
                                        onClick={saveProfile}
                                        disabled={saving}
                                    >
                                        {saving ? "Saving…" : "Save"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <dl className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <dt className={styles.infoLabel}>Height</dt>
                                    <dd className={styles.infoValue}>
                                        {profile.heightCm ? `${profile.heightCm} cm` : "—"}
                                    </dd>
                                </div>

                                <div className={styles.infoItem}>
                                    <dt className={styles.infoLabel}>Weight</dt>
                                    <dd className={styles.infoValue}>
                                        {profile.weightKg ? `${profile.weightKg} kg` : "—"}
                                    </dd>
                                </div>

                                <div className={styles.infoItem}>
                                    <dt className={styles.infoLabel}>Age</dt>
                                    <dd className={styles.infoValue}>{age !== null ? age : "—"}</dd>
                                </div>

                                <div className={styles.infoItem}>
                                    <dt className={styles.infoLabel}>Experience</dt>
                                    <dd className={styles.infoValue}>{profile.experience || "—"}</dd>
                                </div>

                                {profile.notes && (
                                    <div className={`${styles.infoItem} ${styles.infoWide}`}>
                                        <dt className={styles.infoLabel}>Notes</dt>
                                        <dd className={styles.infoValue}>{profile.notes}</dd>
                                    </div>
                                )}
                            </dl>
                        )}
                    </section>

                    { /* calendario */}

                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Activity</h2>
                            <span className={styles.totalBadge}>
                                {totalWorkouts} {totalWorkouts === 1 ? "workout" : "workouts"}
                            </span>
                        </div>

                        <div className={styles.calendar}>
                            <div className={styles.calendarHeader}>
                                <button
                                    className={styles.navButton}
                                    onClick={() => changeMonth(-1)}
                                    aria-label="Previous month"
                                >
                                    ‹
                                </button>

                                <span className={styles.monthLabel}>{monthLabel}</span>

                                <button
                                    className={styles.navButton}
                                    onClick={() => changeMonth(1)}
                                    disabled={isFuture}
                                    aria-label="Next month"
                                >
                                    ›
                                </button>
                            </div>

                            <div className={styles.weekdayRow}>
                                {WEEKDAYS.map((day, i) => (
                                    <span className={styles.weekday} key={i}>{day}</span>
                                ))}
                            </div>

                            <div className={styles.dayGrid}>
                                {calendar.cells.map((day, i) => {
                                    if (day === null) {
                                        return <span className={styles.dayBlank} key={`b${i}`} />;
                                    }

                                    const key = dateKey(new Date(viewYear, viewMonth, day));
                                    const trained = activeDays.has(key);
                                    const isToday = key === dateKey(today);

                                    return (
                                        <span
                                            key={key}
                                            onClick={() => trained && navigate(`/history/${key}`)}

                                            className={[
                                                styles.day,
                                                trained ? styles.dayActive : "",
                                                isToday ? styles.dayToday : "",
                                            ].filter(Boolean).join(" ")}
                                            title={trained ? "Workout completed" : undefined}
                                        >
                                            {day}
                                        </span>
                                    );
                                })}
                            </div>

                            <p className={styles.calendarFooter}>
                                {calendar.monthActive} {calendar.monthActive === 1 ? "day" : "days"} trained this month
                            </p>
                        </div>
                    </section>

                </div>
            </div>
        </>
    );
};
