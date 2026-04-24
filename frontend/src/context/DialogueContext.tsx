import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import dialogues, { type DialogueVariant } from "../data/dialogue";

interface DialogueState {
    lines: string[];
    currentIndex: number;
    next?: string;
    face?: "normal" | "happy" | "shocked" | "sad" | "closed";
    variables?: Record<string, string | number>;
}

interface DialogueContextType {
    currentLine: string | null;
    isActive: boolean;
    currentFace?: "normal" | "happy" | "shocked" | "sad" | "closed";
    startDialogue: (key: string, variables?: Record<string, string | number>) => boolean;
    advance: () => void;
    resetDialogue: (key?: string) => void;
    lockDialogue: () => void;
    unlockDialogue: () => void;
    isLastLine: boolean;
}

const DialogueContext = createContext<DialogueContextType | null>(null);

const STORAGE_KEY = "steamquack_seen_dialogues";

function getInitialSeenDialogues(): Set<string> {
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object' && 'timestamp' in parsed) {
                const isExpired = Date.now() - parsed.timestamp > 1000 * 60 * 30;
                if (isExpired) {
                    sessionStorage.removeItem(STORAGE_KEY);
                    return new Set();
                }
                return new Set(parsed.data);
            } else {
                sessionStorage.removeItem(STORAGE_KEY);
                return new Set();
            }
        }
    } catch (e) {
        console.error("Failed to parse seen dialogues from storage", e);
    }
    return new Set();
}

function pickVariant(key: string): DialogueVariant | null {
    const variants = dialogues[key];
    if (!variants || variants.length === 0) return null;
    return variants[Math.floor(Math.random() * variants.length)];
}

function injectVariables(lines: string[], variables?: Record<string, string | number>): string[] {
    if (!variables) return lines;
    return lines.map(line => {
        let newLine = line;
        for (const [k, v] of Object.entries(variables)) {
            newLine = newLine.replace(new RegExp(`\\[${k}\\]`, 'gi'), String(v));
        }
        return newLine;
    });
}

export function DialogueProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<DialogueState>({ lines: [], currentIndex: 0 });
    const seenDialogues = useRef<Set<string>>(getInitialSeenDialogues());
    const isLocked = useRef<boolean>(false);

    const syncStorage = useCallback(() => {
        const payload = {
            data: Array.from(seenDialogues.current),
            timestamp: Date.now()
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }, []);

    const isActive = state.lines.length > 0 && state.currentIndex < state.lines.length;
    const currentLine = isActive ? state.lines[state.currentIndex] : null;
    const isLastLine = isActive && (state.currentIndex === state.lines.length - 1) && !state.next;


    const lockDialogue = useCallback(() => {
        isLocked.current = true;
    }, []);

    const unlockDialogue = useCallback(() => {
        isLocked.current = false;
    }, []);

    const startDialogue = useCallback((key: string, variables?: Record<string, string | number>) => {
        if (isLocked.current) return false;

        const variant = pickVariant(key);
        if (!variant) return false;

        if (variant.repeatable === false && seenDialogues.current.has(key)) {
            return false;
        }

        if (variant.repeatable === false) {
            seenDialogues.current.add(key);
            syncStorage();
        }

        const processedLines = injectVariables(variant.lines, variables);
        setState({
            lines: processedLines,
            currentIndex: 0,
            next: variant.next,
            face: variant.face,
            variables
        });

        return true;
    }, [syncStorage]);

    const advance = useCallback(() => {
        setState((prev) => {
            const nextIndex = prev.currentIndex + 1;

            if (nextIndex < prev.lines.length) {
                return { ...prev, currentIndex: nextIndex };
            }

            if (prev.next) {
                const variant = pickVariant(prev.next);
                if (variant) {
                    if (variant.repeatable === false) {
                        seenDialogues.current.add(prev.next);
                        syncStorage();
                    }

                    const processedLines = injectVariables(variant.lines, prev.variables);
                    return {
                        lines: processedLines,
                        currentIndex: 0,
                        next: variant.next,
                        face: variant.face,
                        variables: prev.variables
                    };
                }
            }

            return { ...prev, currentIndex: nextIndex };
        });
    }, [syncStorage]);

    const resetDialogue = useCallback((key?: string) => {
        if (key) {
            seenDialogues.current.delete(key);
        } else {
            seenDialogues.current.clear();
        }
        syncStorage();
    }, [syncStorage]);

    return (
        <DialogueContext.Provider value={{
            currentLine, isActive, currentFace: state.face,
            startDialogue, advance, resetDialogue,
            lockDialogue, unlockDialogue, isLastLine
        }}>
            {children}
        </DialogueContext.Provider>
    );
}

export function useDialogue() {
    const ctx = useContext(DialogueContext);
    if (!ctx) throw new Error("useDialogue must be used within a DialogueProvider");
    return ctx;
}