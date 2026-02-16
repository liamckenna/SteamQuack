import "./App.css";
import Speech from '../Speech/Speech.tsx'
import UserIcon from '../UserIcon/UserIcon.tsx'
import Folder from '../Folder/Folder.tsx'
import Decorations from '../Decorations/Decorations.tsx'
import Logo from '../Logo/Logo.tsx'
import Ducktor from '../Ducktor/Ducktor.tsx'

export default function App() {
  return (
    <div className="screen-container">
      <div className="content-container">
        <div className="column left-column">
          <div className="top-row"><UserIcon /></div>
          <div className="bottom-row"><Decorations /></div>
        </div>
        <div className="column middle-column">
          <div className="top-row"><Speech /></div>
          <div className="bottom-row"><Folder /></div>
        </div>
        <div className="column right-column">
          <div className="top-row"><Logo /></div>
          <div className="bottom-row"><Ducktor /></div>
        </div>
      </div>
    </div>
  )
}