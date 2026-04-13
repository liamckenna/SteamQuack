import "./Speech.css";
import { useEffect } from "react";
import { useDialogue } from "../../context/DialogueContext";

export default function Speech() {
    const { currentLine, isActive, advance, startDialogue } = useDialogue();

    useEffect(() => {
        startDialogue("openingLine");
    }, [startDialogue]);

    if (!isActive || !currentLine) {
        return (
            <div className="speech speech--idle">
                <p className="speech__text">...</p>
            </div>
        );
    }

    return (
        <div className="speech" onClick={advance}>
            <p className="speech__text">{currentLine}</p>
            <span className="speech__continue">▼</span>
        </div>
    );
}