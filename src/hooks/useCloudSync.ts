import { useEffect, useRef, useState } from 'react';
import { CLOUD_ENABLED, FB, type User } from '../lib/firebase';
import { useDbStore } from './useDbStore';
import { freshAccount } from '../lib/storage';
import { demoData } from '../lib/demoData';
import { uid } from '../lib/format';

export type SyncStatus = 'off' | 'sync' | 'on';

const COLS = ['bancas', 'methods', 'ops', 'cycles'] as const;
type Col = (typeof COLS)[number];
type SyncCache = Record<Col, Record<string, string>> & { meta: string };

function emptyCache(): SyncCache {
  return { bancas: {}, methods: {}, ops: {}, cycles: {}, meta: '' };
}

function clean<T>(o: T): T {
  return JSON.parse(JSON.stringify(o));
}

export interface CloudSync {
  cloudEnabled: boolean;
  authReady: boolean;
  user: User | null;
  status: SyncStatus;
  /** Sem conta, não há onde persistir — nada aqui é gravado no navegador. */
  locked: boolean;
  tutorialSeen: boolean;
  markTutorialSeen: () => void;
  resetAccount: () => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export function useCloudSync(): CloudSync {
  const [authReady, setAuthReady] = useState(!CLOUD_ENABLED);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SyncStatus>('off');
  const [tutorialSeen, setTutorialSeen] = useState(true);

  const synced = useRef<SyncCache>(emptyCache());
  const unsubs = useRef<Array<() => void>>([]);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRef = useRef<User | null>(null);
  const tutorialSeenRef = useRef(true);
  const flushPushRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    if (!CLOUD_ENABLED) {
      // Sem Firebase configurado: apenas a sessão de demonstração, em memória, nunca salva em lugar nenhum.
      useDbStore.getState().loadDb(demoData(), 'demo');
      return;
    }

    const flushPush = async () => {
      const u = userRef.current;
      if (!u) return;
      const db = useDbStore.getState().db;
      const jobs: Array<{ t: 'set' | 'del' | 'meta'; col?: Col; id?: string }> = [];
      COLS.forEach((col) => {
        const cur: Record<string, string> = {};
        (db[col] || []).forEach((it: any) => {
          if (it?.id) cur[it.id] = JSON.stringify(it);
        });
        Object.keys(cur).forEach((id) => {
          if (cur[id] !== synced.current[col][id]) jobs.push({ t: 'set', col, id });
        });
        Object.keys(synced.current[col]).forEach((id) => {
          if (!(id in cur)) jobs.push({ t: 'del', col, id });
        });
        synced.current[col] = cur;
      });
      const meta = {
        activeBanca: db.activeBanca,
        settings: db.settings,
        teams: db.teams,
        comps: db.comps,
        tutorialSeen: tutorialSeenRef.current,
        importedMarketIds: db.importedMarketIds,
        email: u.email,
        updatedAt: Date.now(),
      };
      const mj = JSON.stringify(meta);
      if (mj !== synced.current.meta) {
        jobs.push({ t: 'meta' });
        synced.current.meta = mj;
      }
      try {
        for (let i = 0; i < jobs.length; i += 400) {
          const batch = FB.writeBatch();
          jobs.slice(i, i + 400).forEach((j) => {
            if (j.t === 'meta') batch.set(FB.doc('users', u.uid), clean(meta), { merge: true });
            else if (j.t === 'set') batch.set(FB.doc('users', u.uid, j.col!, j.id!), clean((db[j.col!] as any[]).find((x) => x.id === j.id)));
            else batch.delete(FB.doc('users', u.uid, j.col!, j.id!));
          });
          await batch.commit();
        }
        setStatus('on');
      } catch (err: any) {
        console.error(err);
        setStatus('off');
      }
    };

    flushPushRef.current = flushPush;

    const cloudPush = () => {
      setStatus('sync');
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(flushPush, 600);
    };
    useDbStore.getState().setCloudPush(cloudPush);

    const subscribe = (uid_: string) => {
      COLS.forEach((col) => {
        unsubs.current.push(
          FB.onSnapshot(
            FB.col('users', uid_, col),
            (snap: any) => {
              const arr: any[] = [];
              const map: Record<string, string> = {};
              snap.forEach((d: any) => {
                const v = d.data();
                v.id = d.id;
                arr.push(v);
                map[d.id] = JSON.stringify(v);
              });
              const db = { ...useDbStore.getState().db, [col]: arr };
              synced.current[col] = map;
              let needsSeed = false;
              if (!db.bancas.length && col === 'bancas') {
                db.bancas = [{ id: uid(), name: 'Banca principal', initial: 1000, stake: 20, createdAt: Date.now() }];
                db.activeBanca = db.bancas[0].id;
                synced.current.bancas = {};
                needsSeed = true;
              }
              if (db.activeBanca && !db.bancas.some((b) => b.id === db.activeBanca) && db.bancas[0]) db.activeBanca = db.bancas[0].id;
              useDbStore.getState().applyRemote(db);
              if (needsSeed) cloudPush();
            },
            (err: any) => console.error(err)
          )
        );
      });
      unsubs.current.push(
        FB.onSnapshot(FB.doc('users', uid_), (snap: any) => {
          const v = snap.data();
          if (!v) return;
          const db = { ...useDbStore.getState().db };
          if (v.activeBanca) db.activeBanca = v.activeBanca;
          if (v.settings) db.settings = v.settings;
          if (Array.isArray(v.teams)) db.teams = v.teams;
          if (Array.isArray(v.comps)) db.comps = v.comps;
          if (Array.isArray(v.importedMarketIds)) db.importedMarketIds = v.importedMarketIds;
          const seen = v.tutorialSeen === true;
          tutorialSeenRef.current = seen;
          setTutorialSeen(seen);
          synced.current.meta = JSON.stringify({
            activeBanca: db.activeBanca,
            settings: db.settings,
            teams: db.teams,
            comps: db.comps,
            tutorialSeen: seen,
            importedMarketIds: db.importedMarketIds,
            email: userRef.current?.email,
            updatedAt: v.updatedAt,
          });
          useDbStore.getState().applyRemote(db);
        })
      );
    };

    const onLogin = async (u: User) => {
      userRef.current = u;
      setUser(u);
      setStatus('sync');
      try {
        const metaDoc = await FB.getDoc(FB.doc('users', u.uid));
        const opsSnap = await FB.getDocs(FB.col('users', u.uid, 'ops'));
        const isNew = !metaDoc.exists() && opsSnap.empty;
        if (isNew) {
          synced.current = emptyCache();
          tutorialSeenRef.current = false;
          setTutorialSeen(false);
          useDbStore.getState().loadDb(freshAccount(), 'cloud');
          await flushPush();
        }
        subscribe(u.uid);
        useDbStore.setState({ mode: 'cloud' });
        setStatus('on');
      } catch (err) {
        console.error(err);
        setStatus('off');
      } finally {
        setAuthReady(true);
      }
    };

    const onLogout = () => {
      unsubs.current.forEach((u) => {
        try {
          u();
        } catch {
          /* ignore */
        }
      });
      unsubs.current = [];
      userRef.current = null;
      setUser(null);
      synced.current = emptyCache();
      setStatus('off');
      useDbStore.getState().loadDb(demoData(), 'demo');
      setAuthReady(true);
    };

    // Mostra dados de demonstração imediatamente enquanto o Firebase resolve o estado de login.
    useDbStore.getState().loadDb(demoData(), 'demo');

    const unsubAuth = FB.onAuth((u) => {
      if (u) onLogin(u);
      else onLogout();
    });

    return () => {
      unsubAuth();
      unsubs.current.forEach((u) => {
        try {
          u();
        } catch {
          /* ignore */
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markTutorialSeen = () => {
    if (tutorialSeenRef.current) return;
    tutorialSeenRef.current = true;
    setTutorialSeen(true);
    flushPushRef.current();
  };

  const resetAccount = async () => {
    const u = userRef.current;
    if (!CLOUD_ENABLED || !u) return;
    setStatus('sync');
    try {
      for (const col of COLS) {
        const snap = await FB.getDocs(FB.col('users', u.uid, col));
        const ids: string[] = [];
        snap.forEach((d: any) => ids.push(d.id));
        for (let i = 0; i < ids.length; i += 400) {
          const batch = FB.writeBatch();
          ids.slice(i, i + 400).forEach((id) => batch.delete(FB.doc('users', u.uid, col, id)));
          await batch.commit();
        }
      }
      synced.current = emptyCache();
      tutorialSeenRef.current = false;
      setTutorialSeen(false);
      useDbStore.getState().loadDb(freshAccount(), 'cloud');
      await flushPushRef.current();
      setStatus('on');
    } catch (err) {
      console.error(err);
      setStatus('off');
      throw err;
    }
  };

  return {
    cloudEnabled: CLOUD_ENABLED,
    authReady,
    user,
    status,
    locked: !user,
    tutorialSeen,
    markTutorialSeen,
    resetAccount,
    signIn: async (email, pass) => {
      await FB.signIn(email, pass);
    },
    signUp: async (email, pass) => {
      await FB.signUp(email, pass);
    },
    signOutUser: async () => {
      await FB.signOut();
    },
    resetPassword: async (email) => {
      await FB.reset(email);
    },
  };
}
