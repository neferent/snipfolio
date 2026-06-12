import { consumePostAuthRedirect } from '~/composables/usePostAuthRedirect'
import { useCheckout } from '~/composables/useCheckout'

/** After sign-in/sign-up completes, resumes the user's original intent: either
 *  navigating back to where they were, or — if they were sent to sign in mid-checkout —
 *  launching checkout directly so they land on the dashboard already Pro. */
export function useResumePostAuth() {
  const { startCheckout } = useCheckout()

  async function resume(options?: { replace?: boolean }) {
    const { path, checkoutType } = consumePostAuthRedirect()
    if (checkoutType) {
      await startCheckout(checkoutType, path)
      return
    }
    await navigateTo(path, options)
  }

  return { resume }
}
