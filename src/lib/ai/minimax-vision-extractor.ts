const MINIMAX_CHAT_COMPLETIONS_URL = "https://api.minimax.io/v1/chat/completions";
const DEFAULT_MINIMAX_MODEL = "MiniMax-M3";

type MiniMaxVisionCompletion = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export async function extractImageTextWithMiniMax({
  dataUrl,
  fileName,
  mimeType,
}: {
  dataUrl: string;
  fileName: string;
  mimeType: string;
}) {
  const apiKey = process.env.MINIMAX_API_KEY;

  if (!apiKey) {
    return null;
  }

  const response = await fetch(MINIMAX_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.MINIMAX_MODEL ?? DEFAULT_MINIMAX_MODEL,
      temperature: 0,
      max_completion_tokens: 1200,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                "Extract useful presentation source text from this screenshot.",
                "Return concise plain text only.",
                "Include visible headings, numbers, table values, chart labels, and business meaning.",
                `File name: ${fileName}`,
                `MIME type: ${mimeType}`,
              ].join("\n"),
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`MiniMax image extraction failed with status ${response.status}`);
  }

  const completion = (await response.json()) as MiniMaxVisionCompletion;
  const content = completion.choices?.[0]?.message?.content?.trim();

  return content || null;
}
