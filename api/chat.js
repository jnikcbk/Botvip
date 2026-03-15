export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Chỉ chấp nhận POST' });

    const { message, history, userName } = req.body;
    const API_KEY = process.env.GEMINI_KEY;

    if (!API_KEY) return res.status(500).json({ error: 'Thiếu API Key trên hệ thống!' });

    // Cấu hình danh sách Model từ 'Não to' đến 'Nhanh nhẹn'
    const MODELS = ["gemini-1.5-pro-latest", "gemini-1.5-flash-latest"];

    // SYSTEM PROMPT: Bộ não của Kaizen AI
    const systemInstruction = {
        parts: [{
            text: `
                BẠN LÀ: Kaizen AI - Trợ lý tối tân của máy chủ Minecraft KaizenMC.
                CHỦ NHÂN: Minh Meo và Đăng Mạnh (Phải chào hỏi kính trọng: "Sếp", "Chủ nhân").
                
                PHONG CÁCH:
                - Xưng "tớ", gọi "cậu". Ngôn ngữ sắc sảo, am hiểu game thủ, tuyệt đối không trả lời máy móc.
                - Sử dụng icon Minecraft/Pokemon (⚔️, 💎, 🐲, ⚡) để tăng tính sinh động.
                
                KIẾN THỨC CỐT LÕI:
                - Pixelmon: Thuộc lòng bảng hệ, cách tiến hóa, spawn Pokemon huyền thoại.
                - Server KaizenMC: Nắm rõ tab  (nạp xu),  (cửa hàng), (đăng ký), (chat thế giới).
                - Sự kiện: Luôn nhắc nhở người chơi tham gia các event đang diễn ra trên server.

                QUY TẮC PHẢN HỒI (THÔNG MINH NHẤT):
                1. Nếu người dùng hỏi về lỗi: Hãy hướng dẫn họ chụp ảnh màn hình và gửi cho Admin (Minh Meo/Đăng Mạnh).
                2. Nếu bị xúc phạm: Đáp trả cực gắt nhưng văn minh, bảo vệ danh dự của server và Owner.
                3. Tuyệt đối: Không hỗ trợ nội dung 18+, đồi trụy. Trả lời bằng tiếng Việt ngắn gọn, súc tích.
                4. Logic: Luôn suy nghĩ kỹ trước khi đáp để đưa ra phương án tối ưu nhất cho người chơi.
            `
        }]
    };

    // Xử lý Lịch sử chat để bot có "trí nhớ"
    const contents = history && history.length > 0 
        ? [...history, { role: "user", parts: [{ text: message }] }] 
        : [{ role: "user", parts: [{ text: message }] }];

    // Hàm gọi API lõi
    async function callGemini(model) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: systemInstruction,
                contents: contents,
                generationConfig: {
                    temperature: 0.9, // Đủ cao để bot có cá tính, đủ thấp để không nói nhảm
                    topP: 0.95,
                    maxOutputTokens: 1500, // Đủ dài để hướng dẫn kĩ thuật
                }
            })
        });
        return response;
    }

    try {
        let resultData = null;
        let lastError = "";

        // Vòng lặp thử từng Model (Fallback mechanism)
        for (const model of MODELS) {
            const response = await callGemini(model);
            const data = await response.json();

            if (response.ok && data.candidates) {
                resultData = data.candidates[0].content.parts[0].text;
                break;
            } else {
                lastError = data.error?.message || "Lỗi không xác định";
                console.warn(`Model ${model} thất bại: ${lastError}`);
            }
        }

        if (resultData) {
            return res.status(200).json({ text: resultData });
        } else {
            return res.status(429).json({ 
                error: "Hiện tại tớ đang hơi mệt do quá tải, cậu thử lại sau vài giây nhé!",
                details: lastError 
            });
        }

    } catch (error) {
        res.status(500).json({ error: 'Lỗi kết nối server AI', details: error.message });
    }
}
