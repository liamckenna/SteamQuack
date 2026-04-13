import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import dialogues, { type DialogueVariant } from "../data/dialogue";

interface DialogueState {
    lines: string[];
    currentIndex: number;
    next?: string;
}

interface DialogueContextType {
    currentLine: string | null;
    isActive: boolean;
    startDialogue: (key: string) => void;
    advance: () => void;
}

const DialogueContext = createContext<DialogueContextType | null>(null);

function pickVariant(key: string): DialogueVariant | null {
    const variants = dialogues[key];
    if (!variants || variants.length === 0) return null;
    return variants[Math.floor(Math.random() * variants.length)];
}

export function DialogueProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<DialogueState>({ lines: [], currentIndex: 0 });

    const isActive = state.lines.length > 0 && state.currentIndex < state.lines.length;
    const currentLine = isActive ? state.lines[state.currentIndex] : null;

    const startDialogue = useCallback((key: string) => {
        const variant = pickVariant(key);
        if (variant) {
            setState({ lines: variant.lines, currentIndex: 0, next: variant.next });
        }
    }, []);

    const advance = useCallback(() => {
        setState((prev) => {
            const nextIndex = prev.currentIndex + 1;

            if (nextIndex < prev.lines.length) {
                return { ...prev, currentIndex: nextIndex };
            }

            if (prev.next) {
                const variant = pickVariant(prev.next);
                if (variant) {
                    return { lines: variant.lines, currentIndex: 0, next: variant.next };
                }
            }

            return { ...prev, currentIndex: nextIndex };
        });
    }, []);

    return (
        <DialogueContext.Provider value={{ currentLine, isActive, startDialogue, advance }}>
            {children}
        </DialogueContext.Provider>
    );
}

export function useDialogue() {
    const ctx = useContext(DialogueContext);
    if (!ctx) throw new Error("useDialogue must be used within a DialogueProvider");
    return ctx;
}