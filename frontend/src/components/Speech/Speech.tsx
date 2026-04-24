import "./Speech.css";
import { useEffect, useRef } from "react";
import { useDialogue } from "../../context/DialogueContext";
import React from "react";

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

function parseFormattedText(text: string) {
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            const boldText = part.slice(2, -2);
            return <strong key={index}>{boldText}</strong>;
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
    });
}

export default function Speech() {
    const { currentLine, isActive, advance, startDialogue, isLastLine } = useDialogue();
    const hasInitialized = useRef(false);

    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        startDialogue("openingLine");
    }, [startDialogue]);

    if (!isActive || !currentLine) {
        return (
            <div className="speech speech--idle">
                <div
                    className="speech__bubble-img speech__bubble-bg-mask"
                    style={{
                        WebkitMaskImage: `url(${speechBubbleBg})`,
                        maskImage: `url(${speechBubbleBg})`
                    }}
                />
                <img src={speechBubbleOutline} alt="Speech Bubble Outline" className="speech__bubble-img speech__bubble-outline" />
                <div className="speech__content">
                    <p className="speech__text" style={{ fontSize: "2rem" }}>...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="speech clickable" onClick={advance}>
            <div
                className="speech__bubble-img speech__bubble-bg-mask"
                style={{
                    WebkitMaskImage: `url(${speechBubbleBg})`,
                    maskImage: `url(${speechBubbleBg})`
                }}
            />
            <img src={speechBubbleOutline} alt="Speech Bubble Outline" className="speech__bubble-img speech__bubble-outline" />

            <div className="speech__content">
                <p className="speech__text" style={{ fontSize: "1.5rem" }}>
                    {parseFormattedText(currentLine)}
                </p>
                {isLastLine ? (
                    <span className="speech__continue speech__continue--last">✓</span>
                ) : (
                    <span className="speech__continue">▼</span>
                )}
            </div>
        </div>
    );
}