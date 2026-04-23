import "./Logo.css";
import signPrimary from "../../assets/images/Sign-Primary.png";
import signSecondary from "../../assets/images/Sign-Secondary.png";

export default function Logo() {
    return (
        <div className="logo">
            <img
                src={signSecondary}
                alt="SteamQuack Sign Background"
                className="logo__img logo__layer-secondary"
            />
            <img
                src={signPrimary}
                alt="SteamQuack Sign Foreground"
                className="logo__img logo__layer-primary"
            />
        </div>
    );
}