function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  const chunks = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? JSON.parse(rawBody) : {};
}

function buildHtmlBody(bodyText) {
  const escaped = String(bodyText || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; background: #f4f7fb; padding: 24px;">
      <div style="max-width: 760px; margin: 0 auto; background: #ffffff; border: 1px solid #d7dfec; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0b4ea2, #072d62); color: #ffffff; padding: 20px 24px;">
          <div style="font-size: 12px; letter-spacing: .08em; text-transform: uppercase; opacity: .88;">DF Pneus Michelin</div>
          <h1 style="margin: 8px 0 0; font-size: 24px; line-height: 1.2;">Checklist Digital com PDF Anexado</h1>
        </div>
        <div style="padding: 24px; color: #162031;">
          <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.65;">
            O checklist foi enviado automaticamente pelo sistema e o PDF segue anexado neste e-mail.
          </p>
          <pre style="margin: 0; white-space: pre-wrap; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.7;">${escaped}</pre>
        </div>
      </div>
    </div>
  `;
}

module.exports = async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido." });
    return;
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CHECKLIST_FROM_EMAIL;
  const fromName = process.env.CHECKLIST_FROM_NAME || "DF Pneus Michelin";
  const replyTo = process.env.CHECKLIST_REPLY_TO || undefined;

  if (!resendApiKey || !fromEmail) {
    res.status(500).json({
      error: "Variáveis RESEND_API_KEY e CHECKLIST_FROM_EMAIL não configuradas."
    });
    return;
  }

  try {
    const payload = await readJsonBody(req);
    const {
      toEmail,
      subject,
      bodyText,
      pdfBase64,
      pdfFilename
    } = payload || {};

    if (!toEmail || !subject || !bodyText || !pdfBase64 || !pdfFilename) {
      res.status(400).json({
        error: "Dados obrigatórios ausentes para envio do checklist."
      });
      return;
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [toEmail],
        reply_to: replyTo ? [replyTo] : undefined,
        subject,
        text: bodyText,
        html: buildHtmlBody(bodyText),
        attachments: [
          {
            filename: pdfFilename,
            content: pdfBase64
          }
        ]
      })
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      res.status(resendResponse.status).json({
        error: resendData?.message || resendData?.error || "Falha ao enviar pelo Resend.",
        provider: resendData
      });
      return;
    }

    res.status(200).json({
      success: true,
      id: resendData.id
    });
  } catch (error) {
    res.status(500).json({
      error: error?.message || "Erro interno ao enviar checklist."
    });
  }
};
