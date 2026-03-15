export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Chỉ POST thôi sếp!' });

    const { message, history } = req.body;

    // 1. CƠ CHẾ XOAY TUA API KEY: Thêm càng nhiều Key càng tốt để nhân đôi/ba hạn mức
    const API_KEYS = [
        process.env.GEMINI_KEY_1, // Key chính
        process.env.GEMINI_KEY_2, // Key dự phòng 1
        process.env.GEMINI_KEY_3  // Key dự phòng 2
    ].filter(key => key); // Chỉ lấy những Key đã được điền

    if (API_KEYS.length === 0) return res.status(500).json({ error: 'Chưa cài KEY nào sếp ơi!' });

    // 2. DANH SÁCH MODEL TỪ CAO XUỐNG THẤP
    const MODELS = [
        "gemini-1.5-pro-latest",   // Não to nhất
        "gemini-2.0-flash-exp",    // Thông minh & bắt trend
        "gemini-1.5-flash-latest"  // "Trâu" nhất, ít lỗi nhất
    ];

    const systemInstruction = {
        parts: [{
            text: `Bạn là Kaizen AI - Trợ lý thông minh nhất máy chủ KaizenMC.
            - Chủ nhân: Minh Meo, Đăng Mạnh (Chào kính trọng).
            - Xưng: tớ - cậu. Phong cách: Game thủ chuyên nghiệp, am hiểu Pixelmon/Minecraft.
            - Nhiệm vụ: Hỗ trợ nạp xu, lệnh server, hướng dẫn chơi.
            - Tuyệt đối: Không 18+, bảo vệ Owners nếu bị xúc phạm.`
        }]
    };

    const contents = history && history.length > 0 
        ? [...history, { role: "user", parts: [{ text: message }] }] 
        : [{ role: "user", parts: [{ text: message }] }];

    // Hàm gọi API với tham số linh hoạt
    async function callGemini(model, key) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: systemInstruction,
                    contents: contents,
                    generationConfig: { temperature: 0.8, maxOutputTokens: 1000 }
                })
            });
            const data = await response.json();
            return { ok: response.ok, data, status: response.status };
        } catch (e) {
            return { ok: false, error: e.message };
        }
    }

    // 3. LOGIC XỬ LÝ THÔNG MINH: Thử mọi Key x Thử mọi Model
    try {
        let finalOutput = null;

        for (const model of MODELS) {
            // Với mỗi model, thử lần lượt các API Key để tìm vận may
            for (const key of API_KEYS) {
                const result = await callGemini(model, key);
                
                if (result.ok && result.data.candidates) {
                    finalOutput = result.data.candidates[0].content.parts[0].text;
                    break; 
                }
                
                if (result.status === 429) {
                    console.warn(`Key bị hết hạn mức, đang đổi Key khác...`);
                    continue; 
                }
            }
            if (finalOutput) break; // Đã có câu trả lời từ model tốt nhất có thể
        }

        if (finalOutput) {
            return res.status(200).json({ text: finalOutput });
        } else {
            return res.status(429).json({ 
                text: "Hệ thống đang bảo trì não bộ xíu, cậu đợi 30s rồi hỏi lại tớ nhé! 🙏" 
            });
        }

    } catch (error) {
        res.status(500).json({ error: 'Sập nguồn rồi sếp!', details: error.message });
    }
}
