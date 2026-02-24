import "./UserIcon.css";
import DefaultIcon from '../../assets/images/Sample Profile Icon.jpg'
export default function UserIcon() {
    return (
        <div className="user-icon">
            <img src={DefaultIcon} alt="Default User Icon" />
        </div>
    )
}