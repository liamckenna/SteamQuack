import { createContext, useContext, useState, type ReactNode } from "react";

export type EyeType = "normal" | "happy" | "shocked" | "sad";
export type MouthType = "closed" | "half" | "open";

interface DucktorContextType {
    currentEyes: EyeType;
    setEyes: (eyes: EyeType) => void;
    currentMouth: MouthType;
    setMouth: (mouth: MouthType) => void;
}

const DucktorContext = createContext<DucktorContextType | null>(null);

export function DucktorProvider({ children }: { children: ReactNode }) {
    const [currentEyes, setEyes] = useState<EyeType>("normal");
    const [currentMouth, setMouth] = useState<MouthType>("closed");

    return (
        <DucktorContext.Provider value={{ currentEyes, setEyes, currentMouth, setMouth }}>
            {children}
        </DucktorContext.Provider>
    );
}

export function useDucktor() {
    const ctx = useContext(DucktorContext);
    if (!ctx) throw new Error("useDucktor must be used within a DucktorProvider");
    return ctx;
}