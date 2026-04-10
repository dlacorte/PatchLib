'use server'

import { signIn } from '@/auth'
import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'

export async function signInWithPassword(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const callbackUrl = (formData.get('callbackUrl') as string) || '/library'

  try {
    await signIn('credentials', { email, password, redirectTo: callbackUrl })
  } catch (error) {
    if (error instanceof AuthError) {
      redirect('/login?error=1')
    }
    throw error
  }
}
