export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { type, username, item, price } = req.body;

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  const time = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  let content = '';

  if (type === 'login') {
    content = `**1. ĐĂNG NHẬP**\nTên: **${username || 'Unknown'}**\nThời gian: ${time}`;
  } else if (type === 'purchase') {
    content = `**2. MUA HÀNG**\nNgười dùng: **${username || 'Unknown'}**\nSản phẩm: **${item || 'Unknown'}**\nGiá: **${price ? price.toLocaleString('vi-VN') + ' Xu' : 'N/A'}**\nThời gian: ${time}`;
  } else {
    return res.status(400).json({ error: 'Invalid log type' });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      throw new Error(`Discord error: ${response.status}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending Discord log:', error);
    res.status(500).json({ error: 'Failed to send log' });
  }
}
