import "./Logo.css";
import signPrimary from "../../assets/images/Sign-Primary.png";
import signSecondary from "../../assets/images/Sign-Secondary.png";

export default function Logo() {
    return (
        <div className="logo">
            <div
                className="logo__img logo__layer-secondary"
                style={{
                    WebkitMaskImage: `url(${signSecondary})`,
                    maskImage: `url(${signSecondary})`
                }}
            />
            <img
                src={signPrimary}
                alt="SteamQuack Sign Foreground"
                className="logo__img logo__layer-primary"
            />
        </div>
    );
}