"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Circuit } from "@/types";
import { Nav } from "./Nav";

interface CircuitContextValue {
  circuit: Circuit;
  setCircuit: (c: Circuit) => void;
}

const CircuitContext = createContext<CircuitContextValue>({
  circuit: "ATP",
  setCircuit: () => {},
});

export function useCircuit() {
  return useContext(CircuitContext);
}

export function CircuitProvider({ children }: { children: ReactNode }) {
  const [circuit, setCircuit] = useState<Circuit>("ATP");

  return (
    <CircuitContext.Provider value={{ circuit, setCircuit }}>
      <Nav circuit={circuit} onCircuitChange={setCircuit} />
      {children}
    </CircuitContext.Provider>
  );
}
