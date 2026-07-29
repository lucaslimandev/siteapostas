import type { View } from '../../hooks/useUiStore';

export interface TutorialStep {
  id: string;
  view: View;
  eyebrow: string;
  title: string;
  paragraphs: string[];
  bullets: string[];
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'intro',
    view: 'dash',
    eyebrow: 'Bem-vindo',
    title: 'Sua conta foi criada. Vamos conhecer o app?',
    paragraphs: [
      'Este é um tour guiado pelas sete áreas do app — a cada passo a tela muda de verdade para a área que estamos explicando.',
      'Leva menos de dois minutos e você pode pular a qualquer momento. Como a conta é nova, a maior parte das telas ainda está vazia — é só o que você vai preencher usando o app.',
    ],
    bullets: [],
  },
  {
    id: 'painel',
    view: 'dash',
    eyebrow: '01 · Painel',
    title: 'Veja sua banca de cima',
    paragraphs: [
      'Esta é a tela em que você está agora: o Painel. Ele mostra a banca atual, o resultado acumulado, o ROI, a taxa de acerto e o drawdown máximo — a maior queda entre um pico e um fundo.',
      'O gráfico de evolução pode ser agrupado por dia, semana, mês ou ano, e alternado entre barras, linha ou os dois juntos. Logo abaixo, um comparativo mostra o acumulado de cada método lado a lado — assim que você tiver operações registradas.',
    ],
    bullets: [
      'Ranking dos times que mais dão e mais tiram lucro',
      'Aviso de disciplina sempre que você operar fora da stake do método',
      'Atalho para as últimas operações registradas',
    ],
  },
  {
    id: 'operacoes',
    view: 'ops',
    eyebrow: '02 · Operações',
    title: 'Registre cada entrada em segundos',
    paragraphs: [
      'Esta é a aba Operações — a lista completa de tudo que você registrar. Toda aposta ou trade vira uma operação: data, times, competição, mercado, método usado, stake, odd e resultado (green, red ou anulada).',
      'Use os filtros no topo para achar qualquer operação por período, método, competição, resultado, ou por texto livre.',
    ],
    bullets: [
      'Se a stake usada passar da stake do método (mais a tolerância), a operação é marcada como "fora do método" automaticamente',
      'O saldo acumulado da banca é recalculado a cada linha da tabela',
      'Cada operação tem um campo de observação livre — ótimo para registrar por que você entrou ou saiu',
    ],
  },
  {
    id: 'ciclos',
    view: 'cycles',
    eyebrow: '03 · Ciclos',
    title: 'O método dos ciclos, automatizado',
    paragraphs: [
      'Aqui ficam seus ciclos. Um ciclo dobra um valor inicial em etapas: cada entrada mira um percentual da banca (que pode diminuir a cada entrada), e ao dobrar o valor, o ciclo fecha, saca uma parte e recomeça no próximo.',
      'Ao criar um ciclo, você define quantos ciclos internos ele tem, o percentual inicial, a redução por entrada, o percentual mínimo e quanto sacar em cada fechamento — o primeiro ciclo sempre saca o valor inicial, e o último saca tudo.',
    ],
    bullets: [
      'A trilha visual mostra em qual ciclo você está e o que já foi concluído',
      'O app calcula quantas entradas "green" faltam para fechar o ciclo atual',
      'Toda entrada de um ciclo também aparece nas Operações e nos Relatórios gerais',
    ],
  },
  {
    id: 'relatorios',
    view: 'reports',
    eyebrow: '04 · Relatórios',
    title: 'Descubra o que realmente dá lucro',
    paragraphs: [
      'Os relatórios cruzam suas operações por método, por competição e por time, mostrando número de operações, taxa de acerto, resultado e ROI sobre a stake em cada recorte.',
      'O destaque é o relatório de disciplina no topo desta tela: ele compara o que você realmente ganhou com o que teria ganhado se tivesse seguido a stake de cada método à risca — e mostra o valor exato da diferença.',
    ],
    bullets: [
      'Veja quais métodos, competições e times realmente sustentam o resultado',
      'Descubra se sair do método está custando ou rendendo dinheiro',
      'Filtre tudo por período no canto superior direito',
    ],
  },
  {
    id: 'calendario',
    view: 'calendar',
    eyebrow: '05 · Calendário',
    title: 'Sua rotina, dia a dia',
    paragraphs: [
      'O calendário colore cada dia de verde ou vermelho conforme o resultado, e mostra quantas operações aconteceram naquela data — de relance, dá para notar sequências de dias ruins.',
      'Clique em qualquer dia para ver o resumo e a lista de operações daquela data, no painel ao lado, sem precisar sair da tela.',
    ],
    bullets: ['Navegação rápida entre meses', 'Resumo do mês sempre visível no rodapé do calendário'],
  },
  {
    id: 'metodos',
    view: 'methods',
    eyebrow: '06 · Métodos',
    title: 'Sua biblioteca de estratégias',
    paragraphs: [
      'Cada método guarda um nome, uma definição em texto livre (quando entrar, quando sair, como abortar) e uma stake padrão — que pode ser um valor fixo, uma porcentagem da banca ou um número de unidades.',
      'A tolerância define quanto acima da stake padrão ainda conta como "dentro do método" antes de virar um alerta de disciplina.',
    ],
    bullets: [
      'Métodos são reaproveitados em operações avulsas e em ciclos',
      'Cada método mostra suas próprias estatísticas assim que tiver operações: ROI, acerto, resultado e quantas vezes saiu do combinado',
    ],
  },
  {
    id: 'cadastros',
    view: 'registry',
    eyebrow: '07 · Cadastros',
    title: 'Bancas, times e competições organizados',
    paragraphs: [
      'Aqui você gerencia suas bancas — já criamos uma para você, com valor inicial e unidade padrão. Você pode manter mais de uma ao mesmo tempo e trocar entre elas pelo seletor no topo da tela.',
      'Times e competições não precisam ser cadastrados na mão: assim que você digita um nome novo numa operação, ele é salvo aqui e sugerido da próxima vez.',
    ],
    bullets: ['Troque de banca sem perder nada do histórico de nenhuma delas', 'Remova times ou competições que não usa mais a qualquer momento'],
  },
  {
    id: 'final',
    view: 'dash',
    eyebrow: 'Prontinho',
    title: 'É isso — o resto você descobre usando',
    paragraphs: [
      'O botão R$ / % / u no topo troca a unidade em que os resultados aparecem em todo o app. Exportar e Importar guardam e restauram um backup completo em arquivo, a qualquer momento.',
      'Seus dados sincronizam automaticamente entre aparelhos enquanto você estiver logado. Se um dia quiser recomeçar do zero, existe um botão de reiniciar conta em "Sua conta" — ele apaga tudo e mostra este tutorial de novo.',
    ],
    bullets: [],
  },
];
