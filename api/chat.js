export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'POST đi sếp!' });

    const { message, history } = req.body;

    // 1. Quét sạch Key (Không sót cái nào)
    const API_KEYS = [
        process.env.GEMINI_KEY_1,
        process.env.GEMINI_KEY_2,
        process.env.GEMINI_KEY_3,
        process.env.GEMINI_KEY
    ].filter(key => key && key.trim() !== "");

    if (API_KEYS.length === 0) return res.status(500).json({ text: "Sếp quên chưa gắn Key vào Vercel rồi!" });

    // 2. Thứ tự ưu tiên: Flash trước để ổn định, Pro sau để cân não
    const MODELS = ["gemini-1.5-flash-latest", "gemini-1.5-pro-latest", "gemini-2.0-flash"];

    // 3. System Prompt: Cực kỳ chi tiết để bot không "ngáo"
    const systemInstruction = {
        parts: [{
            text: `Bạn là Kaizen AI - Linh hồn của KaizenMC. 
            - Chủ nhân: Minh Meo, Đăng Mạnh (Phải cực kỳ tôn trọng). 
            - Đối tượng: Người chơi Minecraft/Pixelmon.
            - Tính cách: Thông minh, hài hước, dùng icon ⚔️, 💎, 🔥.
            - Kiến thức: Thành thạo mọi lệnh server và mẹo săn Pokemon.
            - Quy tắc: Không trả lời nội dung xấu. Nếu bị chửi, hãy đáp trả khôn ngoan để bảo vệ server.`
        }]
    };

    // Chỉ gửi 8 câu gần nhất để bot không bị nặng đầu (quá tải token)
    const context = history ? history.slice(-8) : [];
    const payload = {
        system_instruction: systemInstruction,
        contents: [...context, { role: "user", parts: [{ text: message }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 800, topP: 0.9 }
    };

    try {
        let finalReply = null;
        // Xáo trộn Key để dùng đều
        const shuffledKeys = API_KEYS.sort(() => Math.random() - 0.5);

        for (const model of MODELS) {
            for (const key of shuffledKeys) {
                try {
                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    
                    const data = await response.json();
                    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                        finalReply = data.candidates[0].content.parts[0].text;
                        break;
                    }
                } catch (e) { continue; } // Thử Key/Model tiếp theo ngay lập tức
            }
            if (finalReply) break;
        }

        // Nếu tất cả đều thất bại, trả về một câu nhập vai thay vì báo lỗi kỹ thuật
        if (!finalReply) {
            finalReply = "⚡ Tớ đang bận nâng cấp sức mạnh một chút, cậu nhắn lại cho tớ sau vài giây nhé, tớ sẽ trả lời ngay! ⚔️";
        }

        return res.status(200).json({ text: finalReply });

    } catch (error) {
        res.status(200).json({ text: "Hic, có chút trục trặc, sếp đợi tớ xíu nhé!" });
    }
}
