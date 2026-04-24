import "./App.css";
import Speech from '../Speech/Speech.tsx'
import UserIcon from '../UserIcon/UserIcon.tsx'
import Folder from '../Folder/Folder.tsx'
import Decorations from '../Decorations/Decorations.tsx'
import Logo from '../Logo/Logo.tsx'
import Ducktor from '../Ducktor/Ducktor.tsx'
import { DialogueProvider } from '../../context/DialogueContext'
import { DucktorProvider } from '../../context/DucktorContext'

export default function App() {
  return (
    <DialogueProvider>
      <DucktorProvider>
        <div className="screen-container">
          <div className="content-container">
            <div className="column left-column">
              <div className="top-left-row"><UserIcon /></div>
              <div className="bottom-left-row"><Decorations /></div>
            </div>
            <div className="column middle-column">
              <div className="top-middle-row"><Speech /></div>
              <div className="bottom-middle-row"><Folder /></div>
            </div>
            <div className="column right-column">
              <div className="top-row"><Logo /></div>
              <div className="bottom-row"><Ducktor /></div>
            </div>
          </div>
        </div>
      </DucktorProvider>
    </DialogueProvider>
  )
}