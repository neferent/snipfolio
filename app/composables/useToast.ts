type ToastOptions = { description?: string }

async function getToast() {
  const { toast } = await import('vue-sonner')
  return toast
}

export const toast = {
  success: (msg: string, opts?: ToastOptions) => { getToast().then(t => t.success(msg, opts)) },
  error: (msg: string, opts?: ToastOptions) => { getToast().then(t => t.error(msg, opts)) },
  warning: (msg: string, opts?: ToastOptions) => { getToast().then(t => t.warning(msg, opts)) },
  info: (msg: string, opts?: ToastOptions) => { getToast().then(t => t.info(msg, opts)) },
}
