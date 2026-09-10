/**
 * Traduz erros de autenticação (Supabase ou rede) para mensagens claras em
 * português. Nunca expõe a mensagem técnica original ao usuário final.
 */
export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export function translateAuthError(err: unknown): AuthError {
  if (err instanceof AuthError) return err

  const raw =
    typeof err === 'string'
      ? err
      : ((err as { message?: string } | null)?.message ?? '')
  const m = raw.toLowerCase()

  if (!m) return new AuthError('Não foi possível concluir a operação. Tente novamente.')

  if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('network request failed'))
    return new AuthError('Falha de conexão. Verifique sua internet e tente novamente.')

  if (m.includes('invalid login credentials'))
    return new AuthError('E-mail ou senha incorretos.')

  if (m.includes('email not confirmed'))
    return new AuthError('Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.')

  if (m.includes('user already registered') || m.includes('already been registered'))
    return new AuthError('Este e-mail já possui cadastro. Faça login ou recupere sua senha.')

  if (m.includes('password should be at least') || m.includes('password is too short'))
    return new AuthError('A senha deve ter no mínimo 6 caracteres.')

  if (m.includes('unable to validate email address') || m.includes('invalid email') || m.includes('validation_failed'))
    return new AuthError('E-mail inválido.')

  if (m.includes('same_password') || m.includes('new password should be different'))
    return new AuthError('A nova senha deve ser diferente da senha atual.')

  if (m.includes('for security purposes') || m.includes('rate limit') || m.includes('too many requests') || m.includes('email rate limit'))
    return new AuthError('Muitas tentativas. Aguarde alguns instantes e tente novamente.')

  if (m.includes('auth session missing') || m.includes('session_not_found') || m.includes('token has expired') || m.includes('invalid claim'))
    return new AuthError('Link expirado ou inválido. Solicite uma nova recuperação de senha.')

  if (m.includes('signups not allowed') || m.includes('signup is disabled'))
    return new AuthError('O cadastro está desativado no momento. Contate o administrador.')

  return new AuthError('Não foi possível concluir a operação. Tente novamente.')
}
