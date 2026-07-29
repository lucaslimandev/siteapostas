# Gestão de banca — trade esportivo

Aplicação em **React + Vite + TypeScript**, com sincronização opcional via Firebase (Auth + Firestore).

## Rodando localmente

```bash
npm install
npm run dev        # abre em http://localhost:5173
```

## Gerando a versão de produção

```bash
npm run build       # gera a pasta dist/
npm run preview      # testa o build localmente
```

## Estrutura do projeto

```
src/
  lib/            ← tipos, formatação, engine de cálculo (ciclos, disciplina, agrupamentos), Firebase
  hooks/          ← stores (Zustand): dados, UI, diálogos, toast, sincronização com a nuvem
  components/     ← layout (topbar), gráficos (canvas), diálogos, tutorial, landing, peças reutilizáveis
  views/          ← Landing (antes do login) + as sete telas do app: Painel, Operações, Ciclos, Relatórios, Calendário, Métodos, Cadastros
public/
  favicon.svg     ← logo da marca (usada também na tela de carregamento)
legacy/
  gestao-de-banca.html  ← versão anterior (arquivo único), mantida como referência
```

O antigo arquivo único `gestao-de-banca.html` foi substituído por esta aplicação — ele continua disponível em `legacy/` caso precise consultar o código antigo, mas não é mais usado pelo site.

---

# Instalação no Firebase (sincronização em nuvem)

Cinco passos. Leva uns 10 minutos. Sem isso, o site funciona 100% no navegador (local), sem conta.

---

## 1. Criar o banco de dados

No [Console do Firebase](https://console.firebase.google.com), dentro do seu projeto:

**Criação › Firestore Database › Criar banco de dados**

- Modo: **produção** (as regras deste pacote cuidam do acesso)
- Local: **southamerica-east1 (São Paulo)** — menor latência no Brasil

Não crie nenhuma coleção na mão. O app cria a estrutura da pessoa sozinho no primeiro cadastro.

---

## 2. Ligar o cadastro por e-mail

**Criação › Authentication › Começar › E-mail/senha › Ativar › Salvar**

Só isso. Se esquecer esta etapa, o cadastro devolve o aviso "Ative o provedor E-mail/senha no Console do Firebase".

---

## 3. Colar a configuração no arquivo

**Configurações do projeto (engrenagem) › Seus apps › Web `</>`**

Se ainda não existe um app web, registre um (pode marcar "Firebase Hosting" já nesta tela). Copie o objeto `firebaseConfig` e cole em `src/lib/firebaseConfig.ts`:

```ts
export const FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.firebasestorage.app",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:abc123"
};
```

Essa chave é pública por natureza — ela identifica o projeto, não dá acesso a nada. Quem protege os dados são as regras do passo 4.

> Se deixar `apiKey` vazio, o app roda 100% local no navegador, sem conta e sem nuvem.

Depois de editar o arquivo, gere o build de novo (`npm run build`) antes de publicar.

---

## 4. Publicar as regras

**Firestore Database › Regras**, apague o que estiver lá, cole o conteúdo de `firestore.rules` e publique.

Pela linha de comando, se preferir:

```bash
firebase deploy --only firestore:rules
```

O que as regras garantem: sem login não se lê nem se escreve nada; com login, cada pessoa alcança apenas `users/{seu-uid}` e nada além disso — nem por engano, nem pelo console de outro usuário.

> **Se você já tinha publicado uma versão anterior destas regras, republique.** A função `reasonable()` foi corrigida para não bloquear exclusões (`request.resource` é `null` num delete) — sem essa correção, excluir uma operação/ciclo/método/banca, ou usar "Reiniciar conta do zero", falha silenciosamente contra as regras antigas.

---

## 5. Publicar o site

**O login não funciona abrindo o arquivo direto do disco** (`file://`). Precisa de `https://` ou `localhost`.

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
npm run build                  # gera dist/ — firebase.json já aponta "public": "dist"
firebase deploy --only hosting
```

### Só para testar na sua máquina

```bash
npm run dev
# abre automaticamente em http://localhost:5173
```

### Outro domínio (Vercel, Netlify, hospedagem própria)

Comando de build: `npm run build` · pasta de saída: `dist`. Funciona igual, mas registre o domínio em **Authentication › Settings › Domínios autorizados**.

---

## Como fica o banco de dados

Criado automaticamente no primeiro cadastro:

```
users/{uid}                     ← banca ativa, preferências, times, competições, tutorialSeen
users/{uid}/bancas/{id}         ← nome, valor inicial, stake padrão
users/{uid}/methods/{id}        ← nome, definição, stake, tolerância
users/{uid}/ops/{id}            ← data, times, competição, método, stake, odd, resultado, lucro, observação
users/{uid}/cycles/{id}         ← parâmetros do ciclo (% inicial, redução, saques, nº de ciclos)
```

Uma operação de ciclo é uma operação normal com o campo `cycleId` preenchido — por isso ela aparece ao mesmo tempo no ciclo e nos relatórios gerais.

---

## Como o acesso funciona no site

| Situação | O que acontece |
|---|---|
| Visitante | Vê o painel, gráficos, relatórios e calendário com dados de demonstração, só na memória da aba |
| Visitante clicando em qualquer ação | Abre "Criar conta" |
| Cadastrado | Banco de dados criado na hora, com uma banca inicial de R$ 1.000 e unidade de R$ 20 |
| Trocou de aparelho | Mesmo e-mail e senha, mesmos dados |
| Sem internet | Continua registrando; o Firestore guarda em cache e envia quando a conexão volta |

**Nada é salvo no navegador.** Não existe mais um modo "local" com `localStorage` — sem conta, você só vê os dados de demonstração (perdidos ao recarregar a página); com conta, tudo vive no Firestore. A única exceção é o cache offline do próprio Firestore (`persistentLocalCache`), que existe para sincronizar mais rápido quando a conexão cai, não para guardar dados fora da nuvem.

A bolinha ao lado do botão de conta mostra a sincronia: verde sincronizado, âmbar enviando, cinza fora da conta.

---

## Tutorial e reinício de conta

Todo cadastro novo (primeiro login) mostra um tutorial guiado de 9 passos: a cada passo a tela realmente navega para a área explicada (Painel, Operações, Ciclos, Relatórios, Calendário, Métodos, Cadastros), num painel ancorado no canto que não esconde o app por baixo. Dá para pular a qualquer momento ("Pular tutorial") ou navegar com Voltar/Continuar. Uma vez concluído ou pulado, o campo `tutorialSeen` é gravado em `users/{uid}` e ele não aparece de novo nesse aparelho nem em outro (é a mesma conta).

Dentro de **Sua conta › Zona de risco**, o botão **Reiniciar conta do zero** apaga permanentemente todas as bancas, operações, ciclos e métodos da conta — na nuvem — e recria a banca padrão e o tutorial, como se fosse um cadastro novo. A confirmação é um modal próprio do app (nada de `alert`/`confirm` nativo do navegador) que só libera o botão depois de digitar a palavra **REINICIAR**.

---

## Custos

Tudo isso cabe no plano gratuito (Spark): 50 mil leituras, 20 mil escritas e 1 GiB de armazenamento por dia. Uma pessoa registrando 30 operações por dia usa uma fração mínima disso.

---

## Backup

O botão **Exportar** continua funcionando e baixa um JSON com tudo. O **Importar** aceita tanto esse arquivo quanto os backups da versão antiga (só ciclos) — a conversão para o formato novo é automática.
