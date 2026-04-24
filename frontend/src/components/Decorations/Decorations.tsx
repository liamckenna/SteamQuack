import "./Decorations.css";
import chairImage from "../../assets/images/Chair.png";

export default function Decorations() {
    return (
        <div className="decorations">
            <img src={chairImage} alt="Chair Decoration" className="decor-image" />
        </div>
    )
}