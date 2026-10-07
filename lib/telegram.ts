// Plain module on purpose: exported from a 'use server' file this would
// become a publicly callable server action.
// Callers have already saved their data, so a failed alert is only logged.
export async function notifyTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // Plain text (no parse_mode): messages can include visitor input.
        body: JSON.stringify({
          chat_id: chatId,
          text,
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(5000),
      },
    )
    if (!res.ok) {
      console.error('Telegram alert failed', res.status, await res.text())
    }
  } catch (error) {
    console.error('Telegram alert failed', error)
  }
}
