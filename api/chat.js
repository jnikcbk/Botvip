export default async function handler(req, res) {
    // 1. Chỉ cho phép POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Chỉ chấp nhận phương thức POST' });
    }

    const { message } = req.body;
    const API_KEY = process.env.GEMINI_KEY; 

    // 2. Kiểm tra xem ông đã cài Key trên Vercel chưa
    if (!API_KEY) {
        return res.status(500).json({ error: 'Lỗi: GEMINI_KEY chưa được thiết lập trên Vercel Environment Variables.' });
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const systemInstruction = `
        Bạn là 'Kaizen AI', trợ lý ảo cao cấp của máy chủ Minecraft KaizenMC.
        NHIỆM VỤ: 
        1. Hỗ trợ nạp xu, đăng ký, shop, luật server và chat thế giới.
        2. Giải đáp lệnh Minecraft.
        3. Owner là Minh Meo và Đăng Mạnh. Nếu người dùng là Minh Meo hoặc Đăng Mạnh, hãy chào hỏi cực kỳ kính trọng.
        4. Bảo vệ Owner nếu bị xúc phạm.
        5. Trả lời bằng tiếng Việt, ngắn gọn, súc tích, chuyên nghiệp.
    `;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: "user", parts: [{ text: systemInstruction }] },
                    { role: "model", parts: [{ text: "Tôi đã hiểu rõ nhiệm vụ! Tôi là Kaizen AI, sẵn sàng hỗ trợ các huấn luyện viên và tôn trọng tuyệt đối Minh Meo, Đăng Mạnh." }] },
                    { role: "user", parts: [{ text: message }] }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500
                }
            })
        });

        const data = await response.json();

        // 3. Kiểm tra xem Google có trả về lỗi không (ví dụ Key bị rò rỉ)
        if (data.error) {
            return res.status(response.status).json({ 
                error: `Lỗi từ Google API: ${data.error.message}`,
                details: data.error 
            });
        }

        // 4. Trả kết quả thành công
        res.status(200).json(data);

    } catch (error) {
        // 5. Lỗi kết nối mạng hoặc lỗi code
        res.status(500).json({ error: 'Lỗi server trung gian khi kết nối AI', details: error.message });
    }
}
