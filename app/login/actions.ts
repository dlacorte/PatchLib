'use server'

import { signIn } from '@/auth'
import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'

export async function sendMagicLink(formData: FormData) {
  const email = formData.get('email') as string
  const callbackUrl = formData.get('callbackUrl') as string | undefined

  try {
    await signIn('email', {
      email,
      redirectTo: callbackUrl || '/library',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      redirect('/login?error=send-failed')
    }
    // signIn throws a NEXT_REDIRECT for the verification email sent redirect
    throw error
  }
}
