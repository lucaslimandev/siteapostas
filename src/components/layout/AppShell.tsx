import { useCloud } from '../../hooks/useCloudContext';
import { useLandingStore } from '../../hooks/useLandingStore';
import MainApp from './MainApp';
import Landing from '../../views/Landing';
import Tutorial from '../tutorial/Tutorial';
import AuthDialog from '../dialogs/AuthDialog';
import Toast from '../common/Toast';

export default function AppShell() {
  const cloud = useCloud();
  const { show, enter } = useLandingStore();
  const showLanding = show && !cloud.user;
  const showTutorial = !showLanding && !!cloud.user && !cloud.tutorialSeen;

  return (
    <>
      {showLanding ? <Landing onEnter={enter} /> : <MainApp />}
      {showTutorial && <Tutorial onFinish={cloud.markTutorialSeen} />}
      <AuthDialog />
      <Toast />
    </>
  );
}
