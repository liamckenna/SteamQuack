import "./Speech.css";
import { useEffect } from "react";
import { useDialogue } from "../../context/DialogueContext";

import speechBubbleBg from "../../assets/images/Speech-Bubble-Background-White.png";
import speechBubbleOutline from "../../assets/images/Speech-Bubble-Outline.png";

function getDynamicFontSize(text: string) {
    const len = text.length;
    const maxFontSize = 3.5;
    const minFontSize = 1.0;
    const decay = 25;
    const calculatedSize = minFontSize + (maxFontSize - minFontSize) * Math.exp(-len / decay);
    return `${calculatedSize}rem`;
}

export default function Speech() {
    const { currentLine, isActive, advance, startDialogue } = useDialogue();

    useEffect(() => {
        startDialogue("openingLine");
    }, [startDialogue]);

    if (!isActive || !currentLine) {
        return (
            <div className="speech speech--idle">
                <img src={speechBubbleBg} alt="Speech Bubble Background" className="speech__bubble-img speech__bubble-bg" />
                <img src={speechBubbleOutline} alt="Speech Bubble Outline" className="speech__bubble-img speech__bubble-outline" />

                <div className="speech__content">
                    <p className="speech__text" style={{ fontSize: getDynamicFontSize("...") }}>...</p>
                </div>
            </div>
        );
    }

    return (
        // ADDED "clickable" CLASS HERE
        <div className="speech clickable" onClick={advance}>
            <img src={speechBubbleBg} alt="Speech Bubble Background" className="speech__bubble-img speech__bubble-bg" />
            <img src={speechBubbleOutline} alt="Speech Bubble Outline" className="speech__bubble-img speech__bubble-outline" />

            <div className="speech__content">
                <p className="speech__text" style={{ fontSize: getDynamicFontSize(currentLine) }}>
                    {currentLine}
                </p>
                <span className="speech__continue">▼</span>
            </div>
        </div>
    );
}