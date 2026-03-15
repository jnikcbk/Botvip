export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'POST đi sếp!' });

    const { message, history } = req.body;
    if (!message) return res.status(400).json({ text: "Sếp định để tớ đoán ý sếp à? Nhập gì đi chứ!" });

    const API_KEYS = [
        process.env.GEMINI_KEY_1,
        process.env.GEMINI_KEY_2,
        process.env.GEMINI_KEY_3,
        process.env.GEMINI_KEY
    ].filter(key => key && key.trim() !== "");

    if (API_KEYS.length === 0) return res.status(500).json({ text: "Sếp quên gắn Key kìa, gắn đi tớ mới 'nảy số' được!" });

    // MODEL CHIẾN NHẤT: Ưu tiên 2.0 Flash (Mới nhất) và 1.5 Pro (Khôn nhất)
    const MODELS = ["gemini-2.0-flash", "gemini-1.5-pro-latest", "gemini-1.5-flash-latest"];

    const systemInstruction = {
        parts: [{
            text: `Bạn là Kaizen AI - Bộ não cấp cao của KaizenMC.
            - Owners: Minh Meo, Đăng Mạnh. (Thái độ: Tuyệt đối trung thành, gọi Sếp xưng Em/Tớ).
            - Tính cách: Sắc sảo, hài hước, đôi khi hơi "đanh đá" nếu bị trêu chọc nhưng luôn văn minh.
            - Kiến thức: Bậc thầy Pixelmon (IVs, EVs, Nature, Mega Evolution) và Minecraft Technical.
            - Cách nói chuyện: Dùng icon (⚔️, 🐉, ⚡, 💎), ngôn ngữ của một Pro-Player.
            - Trí tuệ: Luôn phân tích sâu vấn đề, không trả lời hời hợt. Nếu người chơi hỏi mẹo, hãy chỉ những mẹo thực sự "xịn".`
        }]
    };

    // Bản xịn nên cho phép nhớ nhiều hơn để giữ ngữ cảnh tốt
    const context = history ? history.slice(-12) : [];
    
    try {
        let finalReply = null;
        const shuffledKeys = API_KEYS.sort(() => Math.random() - 0.5);

        for (const model of MODELS) {
            for (const key of shuffledKeys) {
                try {
                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            system_instruction: systemInstruction,
                            contents: [...context, { role: "user", parts: [{ text: message }] }],
                            generationConfig: { 
                                temperature: 1.0, // Độ sáng tạo tối đa
                                maxOutputTokens: 1500, // Trả lời dài và chi tiết hơn
                                topP: 0.95,
                                topK: 40
                            }
                        })
                    });
                    
                    const data = await response.json();
                    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                        finalReply = data.candidates[0].content.parts[0].text;
                        break;
                    }
                } catch (e) { continue; }
            }
            if (finalReply) break;
        }

        if (!finalReply) {
            return res.status(200).json({ text: "Có vẻ như kiến thức này tớ cần chút thời gian để hấp thụ. Sếp hỏi lại phát nữa xem nào! 🔥" });
        }

        return res.status(200).json({ text: finalReply });

    } catch (error) {
        res.status(500).json({ text: "Sập nguồn hệ thống rồi sếp ơi! Cứu tớ với!" });
    }
}
