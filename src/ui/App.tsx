import { useGame } from './store';
import { Onboarding } from './screens/Onboarding';

export function App() {
  const { state, dispatch } = useGame();
  if (!state.characterId) {
    return (
      <Onboarding
        onStart={(p) => {
          dispatch({ type: 'onboard', ...p });
          dispatch({ type: 'init', now: new Date() });
        }}
      />
    );
  }
  return <main className="app"><p>준비 중…</p></main>;
}
