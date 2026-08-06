import { useUiStore } from '../../hooks/useUiStore';
import { useDbStore } from '../../hooks/useDbStore';

import Topbar from './Topbar';

import Dashboard from '../../views/Dashboard';
import Operations from '../../views/Operations';
import Cycles from '../../views/Cycles';
import CycleDetail from '../../views/CycleDetail';
import Reports from '../../views/Reports';
import CalendarView from '../../views/Calendar';
import Methods from '../../views/Methods';
import Registry from '../../views/Registry';

import OpDialog from '../dialogs/OpDialog';
import DetailDialog from '../dialogs/DetailDialog';
import CycleDialog from '../dialogs/CycleDialog';
import MethodDialog from '../dialogs/MethodDialog';
import BancaDialog from '../dialogs/BancaDialog';
import AccountDialog from '../dialogs/AccountDialog';
import ImportStatementDialog from '../dialogs/ImportStatementDialog';

export default function MainApp() {
  const view = useUiStore((s) => s.view);
  const db = useDbStore((s) => s.db);

  return (
    <>
      <Topbar />
      <main>
        {view === 'dash' && <Dashboard />}
        {view === 'ops' && <Operations />}
        {view === 'cycles' && <Cycles />}
        {view === 'cycle' && <CycleDetail />}
        {view === 'reports' && <Reports />}
        {view === 'calendar' && <CalendarView />}
        {view === 'methods' && <Methods />}
        {view === 'registry' && <Registry />}
      </main>

      <datalist id="dlTeams">
        {db.teams.map((t) => (
          <option value={t} key={t} />
        ))}
      </datalist>
      <datalist id="dlComps">
        {db.comps.map((c) => (
          <option value={c} key={c} />
        ))}
      </datalist>

      <OpDialog />
      <DetailDialog />
      <CycleDialog />
      <MethodDialog />
      <BancaDialog />
      <AccountDialog />
      <ImportStatementDialog />
    </>
  );
}
