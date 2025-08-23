'use server'

import { createSupabaseServerClient } from '@/clients/supabase-server-client'
import { OAuthProvider } from '@/constants/oauth-provider'
import { SiteURL } from '@/constants/site-url'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * Login with OAuth provider.
 * If the next_url is not provided, the user will be redirected based on his onboarding status
 * @param provider
 * @param next_url the url to redirect to after login, typically used to process extra server side logic (e.g. /invite/redirect)
 */
export async function loginWithProvider(
  provider: OAuthProvider,
  next_url?: string,
) {
  const supabase = await createSupabaseServerClient()
  let auth_callback_url = `${SiteURL.BASE}${SiteURL.API.AUTH_CALLBACK}`

  if (next_url) {
    auth_callback_url = `${SiteURL.BASE}${SiteURL.API.AUTH_CALLBACK}?next=${next_url}`
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: auth_callback_url,
    },
  })

  if (data.url) {
    // use the redirect API for your server framework
    // e.g. https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?client_id=464202196742-acp7as5lokhq8jkg.apps.googleusercontent.com&redirect_to=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback%3Fnext%3D%2Fsignup%2Fcompany&redirect_uri=https%3A%2F%2Fsbejgtiopvmxfovbtpsx.supabase.co%2Fauth%2Fv1%2Fcallback&response_type=code&scope=email%20profile&state=eyJhIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwIiwiaWQiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDAiLCJmdW5jdGlvbl9ob29rcyI6bnVsbCwicHsYmFjaz9uZXh0PS9zaWdudXAvYvEqlv74Vpn9mXsRSp_XXzngk&service=lso&o2v=2&flowName=GeneralOAuthFlow
    redirect(data.url)
  }

  if (error) {
    redirect(SiteURL.ERROR.AUTH)
  }
}

export async function loginWithEmailPassword(formData: FormData) {
  const supabase = await createSupabaseServerClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect(SiteURL.ERROR.AUTH)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signupWithEmailPassword(formData: FormData) {
  const supabase = await createSupabaseServerClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect(SiteURL.ERROR.AUTH)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  revalidatePath(SiteURL.DASHBOARD, 'layout')
  redirect(SiteURL.DASHBOARD)
}
