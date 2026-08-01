import { createContext } from "react";
import type { ExerciseContextType } from "../types";


export const ExerciseContext = createContext<ExerciseContextType | null>(null);