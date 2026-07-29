import Logo from '../components/common/Logo';
import Reveal from '../components/landing/Reveal';
import FeatureSection from '../components/landing/FeatureSection';
import DotNav from '../components/landing/DotNav';
import { useCloud } from '../hooks/useCloudContext';
import { useAuthDialogStore } from '../hooks/useDialogs';
import { PainelVisual, OperacoesVisual, CiclosVisual, RelatoriosVisual, CalendarioVisual, MetodosVisual, CadastrosVisual } from '../components/landing/visuals';

const SPARK_H = [30, 45, 38, 58, 50, 70, 62, 82, 74, 92, 84, 100];

export default function Landing({ onEnter }: { onEnter: () => void }) {
  const cloud = useCloud();
  const openAuth = useAuthDialogStore((s) => s.openAuth);

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="brand">
          <Logo size={30} />
          <b>BANCA</b>
        </div>
        <div className="right">
          {cloud.cloudEnabled && (
            <button className="btn ghost sm" onClick={() => openAuth('in')}>
              Entrar
            </button>
          )}
          <button className="btn primary sm" onClick={onEnter}>
            Começar agora
          </button>
        </div>
      </header>

      <section id="hero" className="hero">
        <Reveal>
          <span className="eyebrow">Gestão de banca para trade esportivo</span>
          <h1>Disciplina, ciclos e resultado — tudo num painel só.</h1>
          <p className="lead">
            Registre suas operações, acompanhe métodos e ciclos de banca, e descubra com números — não com achismo — o que realmente dá lucro e quanto a indisciplina custa.
          </p>
          <div className="cta-row">
            <button className="btn primary" onClick={onEnter}>
              Ver demonstração ao vivo
            </button>
            {cloud.cloudEnabled && (
              <button className="btn ghost" onClick={() => openAuth('up')}>
                Criar conta grátis
              </button>
            )}
          </div>
          <div className="trust">Grátis para começar · seus dados são só seus · funciona offline</div>
        </Reveal>

        <Reveal delay={2} className="hero-visual">
          <div className="hero-stage">
            <div className="section-title">
              <h3 style={{ fontSize: 15 }}>Evolução</h3>
              <span className="chip on">acumulado</span>
            </div>
            <div className="hero-spark">
              {SPARK_H.map((h, i) => (
                <i key={i} style={{ ['--h0' as any]: 0.55 + (i % 3) * 0.08, ['--h1' as any]: 1, height: h + '%', animationDelay: i * 0.09 + 's' }} />
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <FeatureSection
        id="painel"
        num="01"
        eyebrow="Painel"
        title="Veja sua banca de cima"
        description="KPIs em tempo real — banca atual, resultado, ROI, acerto e drawdown máximo — mais um gráfico de evolução que você filtra por dia, semana, mês ou ano."
        bullets={['Comparativo de desempenho entre métodos', 'Ranking dos times que mais dão e tiram lucro', 'Últimas operações com um clique de distância']}
        visual={<PainelVisual />}
      />

      <FeatureSection
        id="operacoes"
        num="02"
        eyebrow="Operações"
        title="Registre cada entrada em segundos"
        description="Data, times, competição, mercado, stake, odd e resultado. Filtre por período, método, competição ou resultado — e ache qualquer operação em texto livre."
        bullets={['Alerta automático quando você foge da stake do método', 'Acumulado calculado a cada linha', 'Observação livre para anotar o porquê de cada entrada']}
        visual={<OperacoesVisual />}
        reverse
      />

      <FeatureSection
        id="ciclos"
        num="03"
        eyebrow="Ciclos"
        title="O método dos ciclos, automatizado"
        description="Dobre sua banca em etapas com percentual decrescente por entrada, saques automáticos a cada ciclo fechado e uma trilha visual de onde você está."
        bullets={['Veja quantas entradas faltam para fechar o ciclo', 'Saque automático configurável por ciclo', 'Cada entrada de ciclo entra também nos relatórios gerais']}
        visual={<CiclosVisual />}
      />

      <FeatureSection
        id="relatorios"
        num="04"
        eyebrow="Relatórios"
        title="Descubra o que realmente dá lucro"
        description="Quebra completa por método, competição e time — e um relatório específico de disciplina: quanto você ganhou (ou perdeu) por fugir da stake combinada."
        bullets={['Resultado real vs. resultado se tivesse seguido o método', 'ROI sobre a stake em cada recorte', 'Unidades (u) para comparar bancas de tamanhos diferentes']}
        visual={<RelatoriosVisual />}
        reverse
      />

      <FeatureSection
        id="calendario"
        num="05"
        eyebrow="Calendário"
        title="Sua rotina, dia a dia"
        description="Visão mensal com o resultado de cada dia colorido — verde ou vermelho — e um clique para ver todas as operações daquela data."
        bullets={['Resumo do mês sempre visível', 'Identifica rajadas de dias negativos', 'Navegação rápida entre meses']}
        visual={<CalendarioVisual />}
      />

      <FeatureSection
        id="metodos"
        num="06"
        eyebrow="Métodos"
        title="Sua biblioteca de estratégias"
        description="Cada método guarda sua definição, a stake padrão — fixa, em % da banca ou em unidades — e a tolerância antes de contar como fora do plano."
        bullets={['Reutilize métodos em vários ciclos', 'Estatísticas por método: ROI, acerto, resultado', 'Base para todo o relatório de disciplina']}
        visual={<MetodosVisual />}
        reverse
      />

      <FeatureSection
        id="cadastros"
        num="07"
        eyebrow="Cadastros"
        title="Bancas, times e competições organizados"
        description="Gerencie mais de uma banca ao mesmo tempo. Times e competições são salvos automaticamente conforme você digita nas operações."
        bullets={['Troque de banca sem perder o histórico', 'Base de times e competições sempre à mão', 'Tudo alimentado automaticamente pelo seu uso']}
        visual={<CadastrosVisual />}
      />

      <section id="comecar" className="cta-final">
        <Reveal>
          <h2>Pronto para organizar sua banca?</h2>
          <p>Comece agora com dados de demonstração, sem precisar criar conta — ou crie a sua para sincronizar entre aparelhos.</p>
          <div className="cta-row" style={{ justifyContent: 'center' }}>
            <button className="btn primary" onClick={onEnter}>
              Começar agora
            </button>
            {cloud.cloudEnabled && (
              <button className="btn ghost" onClick={() => openAuth('up')}>
                Criar conta grátis
              </button>
            )}
          </div>
        </Reveal>
      </section>

      <footer className="landing-footer">
        <Logo size={18} />
        <span>Banca — gestão de trade esportivo</span>
      </footer>

      <DotNav />
    </div>
  );
}
