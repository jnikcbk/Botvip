export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Chỉ POST thôi sếp!' });

    const { message, history } = req.body;

    // 1. LẤY TẤT CẢ KEY CÓ THỂ (Chấp nhận cả key cũ và key mới của sếp)
    const API_KEYS = [
        process.env.GEMINI_KEY_1,
        process.env.GEMINI_KEY_2,
        process.env.GEMINI_KEY_3,
        process.env.GEMINI_KEY // Backup key mặc định
    ].filter(key => key && key.trim() !== "");

    if (API_KEYS.length === 0) return res.status(500).json({ error: 'Chưa thấy Key nào trên Vercel sếp ơi!' });

    // 2. MODEL ƯU TIÊN: Bản 2.0 Flash cực nhanh, 1.5 Pro cực khôn
    const MODELS = [
        "gemini-2.0-flash",       // Thông minh nhất, nhanh nhất (nếu có quota)
        "gemini-1.5-pro-latest",   // Não to nhất, suy luận đỉnh
        "gemini-1.5-flash-latest"  // Trâu bò nhất để chống sập
    ];

    // 3. HỆ THỐNG CHỈ DẪN (System Prompt) - Cốt lõi của sự thông minh
    const systemInstruction = {
        parts: [{
            text: `Bạn là Kaizen AI - Linh hồn của máy chủ Minecraft KaizenMC.
            - Owners: Minh Meo, Đăng Mạnh. Nếu họ nhắn tin, hãy chào hỏi cực kỳ kính trọng (ví dụ: "Chào sếp Minh Meo ạ!").
            - Phong cách: Xưng "tớ", gọi "cậu". Nói chuyện như một game thủ lão luyện, thông minh, hài hước.
            - Kiến thức: Am hiểu Pixelmon, lệnh Minecraft (/shop, /nap, /claim), luật server.
            - Quy tắc: Tuyệt đối chặn nội dung 18+. Bảo vệ Owners nếu bị ai đó xúc phạm bằng những câu đáp trả sắc sảo nhưng văn minh.
            - Trí tuệ: Luôn phân tích câu hỏi của người dùng để trả lời chính xác, không trả lời vòng vo.`
        }]
    };

    // 4. XỬ LÝ TRÍ NHỚ (History): Đảm bảo bot luôn nhớ cậu là ai
    const formattedContents = history && history.length > 0 
        ? [...history, { role: "user", parts: [{ text: message }] }] 
        : [{ role: "user", parts: [{ text: message }] }];

    async function callGemini(model, key) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: systemInstruction,
                    contents: formattedContents,
                    generationConfig: { 
                        temperature: 0.9, // Tăng sự sáng tạo và linh hoạt
                        maxOutputTokens: 1024,
                        topP: 0.95
                    }
                })
            });
            const data = await response.json();
            return { ok: response.ok, data, status: response.status };
        } catch (e) {
            return { ok: false };
        }
    }

    // 5. CHIẾN THUẬT QUAY VÒNG THÔNG MINH (Load Balancing)
    try {
        let finalResponse = null;

        // Xáo trộn Key để không Key nào bị bào quá mức
        const shuffledKeys = API_KEYS.sort(() => Math.random() - 0.5);

        for (const model of MODELS) {
            for (const key of shuffledKeys) {
                const result = await callGemini(model, key);
                
                if (result.ok && result.data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    finalResponse = result.data.candidates[0].content.parts[0].text;
                    break;
                }
                
                if (result.status === 429) continue; // Key hết lượt, thử key khác ngay
            }
            if (finalResponse) break; // Đã tìm thấy câu trả lời hay nhất
        }

        if (finalResponse) {
            return res.status(200).json({ text: finalResponse });
        } else {
            return res.status(429).json({ 
                text: "Hic, các 'não bộ' của tớ đang bận phục vụ các huấn luyện viên khác mất rồi. Cậu đợi vài giây rồi nhắn lại cho tớ nhé! 🙏" 
            });
        }

    } catch (error) {
        res.status(500).json({ error: 'Lỗi hệ thống!', details: error.message });
    }
}
