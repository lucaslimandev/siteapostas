const ERRS: Record<string, string> = {
  'auth/invalid-email': 'E-mail inválido.',
  'auth/user-not-found': 'Não achei uma conta com esse e-mail.',
  'auth/wrong-password': 'Senha incorreta.',
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/email-already-in-use': 'Esse e-mail já tem conta. Use "Entrar".',
  'auth/weak-password': 'Senha muito curta — use 6 caracteres ou mais.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
  'auth/network-request-failed': 'Sem conexão com o servidor.',
  'auth/operation-not-allowed': 'Ative o provedor E-mail/senha no Console do Firebase.',
};

export function authErrorMessage(err: any): string {
  return ERRS[err?.code] || err?.message || 'Erro desconhecido.';
}
