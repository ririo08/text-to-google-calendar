import { GoogleCalendarEventArgs, googleCalendarEventUrl } from 'google-calendar-url'
import { Hono } from 'hono'
import OpenAI from 'openai'

interface Env {
  Bindings: {
    CHATGPT_API_KEY: string
    MAGIC_KEY: string
  }
}

const app = new Hono<Env>()

app.get('/:key', async (c) => {
  const key = c.req.param('key')
  const text = c.req.query('text')

  if (key !== c.env.MAGIC_KEY || !c.env.CHATGPT_API_KEY || !text) {
    return c.text('invalid key', 400)
  }

  const client = new OpenAI({
    apiKey: c.env.CHATGPT_API_KEY
  })

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system', content: `Googleカレンダーに登録するデータを作成するため、下記のJSON形式で出力してください。
title: カレンダーの予定名 簡潔で目的を書いてください
start: 予定の開始日時 YYYYMMDDTHHmmssZ形式、日付のみの場合はYYYYMMDD形式 日本時間の場合はUTCに変換してください
end: 予定の終了日時 YYYYMMDDTHHmmssZ形式、日付のみの場合はYYYYMMDD形式 期間ではない場合はstartと同じ値にしてください 日本時間の場合はUTCに変換してください
details: 予定の内容 URLや番号など、できるかぎり全て含めてください。見やすく改行もしてください
location: 地域や建物などの情報がある場合は書いてください。ない場合は空欄にしてください`},
      { role: 'user', content: text }
    ],
    response_format: { type: "json_object" }
  })

  const res: GoogleCalendarEventArgs = JSON.parse(completion.choices[0].message.content!)
  const url = googleCalendarEventUrl(res)

  return c.redirect(url)
})

export default app
