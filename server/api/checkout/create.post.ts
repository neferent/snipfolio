type CheckoutType = 'pro' | 'pro_early' | 'day_pass'

interface CheckoutBody {
  type: CheckoutType
  projectId?: string
}

export default defineEventHandler(async (event) => {
  const userId = await requireUser(event)
  const body = await readBody<CheckoutBody>(event)
  const config = useRuntimeConfig()

  const variantId = {
    pro: config.public.lsProVariantId,
    pro_early: config.public.lsProEarlyVariantId,
    day_pass: config.public.lsDayPassVariantId,
  }[body.type]

  if (!variantId) throw createError({ statusCode: 400, message: 'Invalid checkout type' })
  if (body.type === 'day_pass' && !body.projectId) {
    throw createError({ statusCode: 400, message: 'projectId required for day pass' })
  }

  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://snipfol.io'
    : 'http://localhost:3000'

  const payload = {
    data: {
      type: 'checkouts',
      attributes: {
        product_options: {
          redirect_url: `${baseUrl}/checkout/success`,
        },
        checkout_data: {
          custom: {
            user_id: userId,
            ...(body.projectId ? { project_id: body.projectId } : {}),
          },
        },
      },
      relationships: {
        store: { data: { type: 'stores', id: String(config.public.lsStoreId) } },
        variant: { data: { type: 'variants', id: String(variantId) } },
      },
    },
  }

  const response = await $fetch<{ data: { attributes: { url: string } } }>(
    'https://api.lemonsqueezy.com/v1/checkouts',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.lsApiKey}`,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
      body: payload,
    },
  )

  return { url: response.data.attributes.url }
})
