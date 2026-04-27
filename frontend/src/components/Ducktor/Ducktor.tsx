import { useEffect, useState } from "react";
import "./Ducktor.css";
import {
  useDucktor,
  type EyeType,
  type MouthType,
} from "../../context/DucktorContext";
import { useDialogue } from "../../context/DialogueContext";

import glassesShade from "../../assets/images/DQ-Glasses-Shade.png";
import mouthClosed from "../../assets/images/DQ-Mouth-Closed.png";
import mouthHalf from "../../assets/images/DQ-Mouth-Half-Open.png";
import mouthOpen from "../../assets/images/DQ-Mouth-Open.png";
import eyesNormal from "../../assets/images/DQ-Eyes-Normal.png";
import eyesHappy from "../../assets/images/DQ-Eyes-Happy.png";
import eyesShocked from "../../assets/images/DQ-Eyes-Shocked.png";
import eyesSad from "../../assets/images/DQ-Eyes-Sad.png";
import eyesClosed from "../../assets/images/DQ-Eyes-Closed.png";

const eyeImages: Record<EyeType | "closed", string> = {
  normal: eyesNormal,
  happy: eyesHappy,
  shocked: eyesShocked,
  sad: eyesSad,
  closed: eyesClosed,
};

const mouthImages: Record<MouthType, string> = {
  closed: mouthClosed,
  half: mouthHalf,
  open: mouthOpen,
};

export default function Ducktor() {
  const { currentEyes, currentMouth, setEyes, setMouth } = useDucktor();
  const { isActive, currentLine, advance, currentFace } = useDialogue();

  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    if (currentFace) {
      setEyes(currentFace);
    } else {
      setEyes("normal");
    }
  }, [currentFace, setEyes]);

  useEffect(() => {
    if (!isActive) {
      setMouth("closed");
      setEyes("normal");
      return;
    }

    setMouth("closed");
    const t1 = setTimeout(() => setMouth("open"), 100);

    return () => {
      clearTimeout(t1);
    };
  }, [isActive, currentLine, setMouth, setEyes]);

  useEffect(() => {
    let t1: NodeJS.Timeout;
    let t2: NodeJS.Timeout;
    let t3: NodeJS.Timeout;
    let t4: NodeJS.Timeout;

    const scheduleNextBlink = () => {
      const nextBlinkIn = Math.random() * 4000 + 2000;
      if (currentEyes !== "closed") {
        t1 = setTimeout(() => {
          setIsBlinking(true);

          t2 = setTimeout(() => {
            setIsBlinking(false);

            if (Math.random() < 0.2) {
              t3 = setTimeout(() => {
                setIsBlinking(true);

                t4 = setTimeout(() => {
                  setIsBlinking(false);
                  scheduleNextBlink();
                }, 100);
              }, 100);
            } else {
              scheduleNextBlink();
            }
          }, 120);
        }, nextBlinkIn);
      }
    };

    scheduleNextBlink();

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const handleClick = () => {
    if (isActive) {
      advance();
    }
  };

  const displayedEyes = isBlinking ? "closed" : currentEyes;

  return (
    <div
      className={`ducktor ${isActive ? "clickable" : ""}`}
      data-cy="ducktor"
      data-face={currentFace ?? "normal"}
      data-eyes={displayedEyes}
      data-mouth={currentMouth}
      onClick={handleClick}
    >
      <img
        src={mouthImages[currentMouth]}
        alt={`Ducktor Mouth ${currentMouth}`}
        className="duck-layer layer-bottom"
      />
      <img
        src={eyeImages[displayedEyes]}
        alt={`Ducktor Eyes ${displayedEyes}`}
        className="duck-layer layer-middle"
      />
      <img
        src={glassesShade}
        alt="Ducktor Glasses"
        className="duck-layer layer-top"
      />
    </div>
  );
}
