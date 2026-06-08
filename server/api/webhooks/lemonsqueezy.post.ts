import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const secret = config.lsWebhookSecret
  if (!secret) throw createError({ statusCode: 500, message: 'Webhook secret not configured' })

  const rawBody = await readRawBody(event)
  if (!rawBody) throw createError({ statusCode: 400, message: 'Empty body' })

  const signature = getHeader(event, 'x-signature')
  if (!signature) throw createError({ statusCode: 400, message: 'Missing signature' })

  const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature))) {
    throw createError({ statusCode: 401, message: 'Invalid signature' })
  }

  const payload = JSON.parse(rawBody)
  const eventName: string = payload.meta?.event_name ?? ''
  const sb = useSupabaseAdmin()

  // Pro subscription created or renewed
  if (eventName === 'subscription_created' || eventName === 'subscription_payment_success') {
    const userId: string | undefined = payload.meta?.custom_data?.user_id
    if (!userId) return { ok: true }

    const { error } = await sb.from('profiles').upsert({ id: userId, is_pro: true }, { onConflict: 'id' })
    if (error) {
      console.error('[webhook] upsert error:', error)
      throw createError({ statusCode: 500, message: 'DB error' })
    }
  }

  // Pro subscription cancelled/expired
  if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
    const userId: string | undefined = payload.meta?.custom_data?.user_id
    if (!userId) return { ok: true }

    const { error } = await sb.from('profiles').upsert({ id: userId, is_pro: false }, { onConflict: 'id' })
    if (error) {
      console.error('[webhook] upsert error:', error)
      throw createError({ statusCode: 500, message: 'DB error' })
    }
  }

  // Day pass purchase
  if (eventName === 'order_created') {
    const variantId: number | undefined = payload.data?.attributes?.first_order_item?.variant_id
    const userId: string | undefined = payload.meta?.custom_data?.user_id
    const projectId: string | undefined = payload.meta?.custom_data?.project_id
    const dayPassVariantIds = [
      Number(config.public.lsDayPassVariantId),
      Number(config.public.lsDayPassVariantIdTest),
    ].filter(Boolean)

    console.log('[webhook] order_created', { variantId, dayPassVariantIds, userId, projectId })

    if (!dayPassVariantIds.includes(variantId as number) || !userId || !projectId) {
      console.log('[webhook] day pass skipped — variant or data mismatch')
      return { ok: true }
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const { error } = await sb.from('project_export_access').upsert(
      { user_id: userId, project_id: projectId, expires_at: expiresAt },
      { onConflict: 'user_id,project_id' },
    )
    if (error) {
      console.error('[webhook] day pass upsert error:', error)
      throw createError({ statusCode: 500, message: 'DB error' })
    }
  }

  return { ok: true }
})
