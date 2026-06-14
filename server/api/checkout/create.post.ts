type CheckoutType = 'pro' | 'day_pass'

interface CheckoutBody {
  type: CheckoutType
}

export default defineEventHandler(async (event) => {
  const userId = await requireUser(event)
  const body = await readBody<CheckoutBody>(event)
  const config = useRuntimeConfig()

  const variantId = {
    pro: config.public.lsProVariantId,
    day_pass: config.public.lsDayPassVariantId,
  }[body.type]

  if (!variantId) throw createError({ statusCode: 400, message: 'Invalid checkout type' })

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
          },
        },
      },
      relationships: {
        store: { data: { type: 'stores', id: String(config.public.lsStoreId) } },
        variant: { data: { type: 'variants', id: String(variantId) } },
      },
    },
  }

  let response: { data: { attributes: { url: string } } }
  try {
    response = await $fetch<{ data: { attributes: { url: string } } }>(
      'https://api.lemonsqueezy.com/v1/checkouts',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.lsApiKey}`,
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
        body: payload,
        signal: AbortSignal.timeout(15_000),
      },
    )
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      throw createError({ statusCode: 504, message: 'Checkout is taking too long to start. Please try again.' })
    }
    throw createError({ statusCode: 502, message: 'Could not start checkout. Please try again.' })
  }

  return { url: response.data.attributes.url }
})
