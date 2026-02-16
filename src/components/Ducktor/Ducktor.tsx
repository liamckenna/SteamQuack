import "./Ducktor.css";
import duckImage from "../../assets/images/Ducktor Quack Sketch.png";

export default function Ducktor() {
    return (
        <div className="ducktor">
            <img src={duckImage} alt="Ducktor Quack" />
        </div>
    )
}