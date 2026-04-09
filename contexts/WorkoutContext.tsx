"use client";

import { createContext, useContext, useReducer } from "react";

type WorkoutState = {
  workoutId?: string;
  elapsedSeconds: number;
};

type Action =
  | { type: "START"; workoutId: string }
  | { type: "TICK" }
  | { type: "RESET" };

const initialState: WorkoutState = {
  workoutId: undefined,
  elapsedSeconds: 0
};

function reducer(state: WorkoutState, action: Action): WorkoutState {
  switch (action.type) {
    case "START":
      return { workoutId: action.workoutId, elapsedSeconds: 0 };
    case "TICK":
      return { ...state, elapsedSeconds: state.elapsedSeconds + 1 };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

const WorkoutContext = createContext<{
  state: WorkoutState;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => undefined
});

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <WorkoutContext.Provider value={{ state, dispatch }}>{children}</WorkoutContext.Provider>;
}

export function useWorkoutContext() {
  return useContext(WorkoutContext);
}
