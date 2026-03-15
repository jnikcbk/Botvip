export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Chỉ chấp nhận phương thức POST' });
    }

    const { message, history } = req.body; // Nhận thêm history để bot có trí nhớ
    const API_KEY = process.env.GEMINI_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: 'Lỗi: GEMINI_KEY chưa được thiết lập.' });
    }

    // Sử dụng Gemini 1.5 Flash để vừa nhanh vừa cực kỳ thông minh
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`;

    const systemInstruction = {
        role: "system",
        parts: [{
            text: `
                BẠN LÀ: 'Kaizen AI' - Siêu trí tuệ nhân tạo độc quyền của máy chủ Minecraft KaizenMC (Pixelmon).
                
                PHONG CÁCH GIAO TIẾP:
                - Luôn xưng "tớ" và gọi người dùng là "cậu". 
                - Ngôn ngữ: Tiếng Việt, trẻ trung, năng động nhưng cực kỳ chuyên nghiệp và am hiểu kỹ thuật.
                - Nếu gặp Minh Meo hoặc Đăng Mạnh (Owners): Phải cực kỳ kính trọng, chào đón bằng danh hiệu "Sếp" hoặc "Chủ nhân".
                
                KIẾN THỨC CHUYÊN MÔN:
                1. Pixelmon & Minecraft: Am hiểu sâu sắc về cách bắt Pokemon, tiến hóa, các tab shop, nap, dang ky, chat the gioi...
                2. Hỗ trợ Server: Giải đáp mọi thắc mắc về nạp xu, sự kiện và luật server.
                3. Bảo vệ: Tuyệt đối không hỗ trợ nội dung 18+, đồi trụy hoặc xúc phạm Owner. Nếu bị xúc phạm, hãy đáp trả một cách lịch sự nhưng sắc bén để bảo vệ uy nghiêm của KaizenMC.

                QUY TRÌNH SUY NGHĨ:
                - Trước khi trả lời, hãy phân tích ý định của người dùng.
                - Trả lời ngắn gọn, súc tích, đi thẳng vào vấn đề nhưng vẫn đầy đủ thông tin.
                - Luôn tìm cách khuyến khích người chơi tham gia các hoạt động trên server.
            `
        }]
    };

    try {
        // Chuẩn bị nội dung chat bao gồm lịch sử (nếu có) để bot nhớ được nội dung trước đó
        const contents = history ? [...history, { role: "user", parts: [{ text: message }] }] : [{ role: "user", parts: [{ text: message }] }];

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: systemInstruction, // Đưa cấu hình vào đây
                contents: contents,
                generationConfig: {
                    temperature: 0.8, // Tăng một chút độ sáng tạo cho bot tự nhiên
                    topP: 0.95,
                    maxOutputTokens: 1024,
                    responseMimeType: "text/plain",
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(response.status).json({ error: data.error.message });
        }

        // Trả về trực tiếp văn bản cho gọn
        const botResponse = data.candidates[0].content.parts[0].text;
        res.status(200).json({ text: botResponse });

    } catch (error) {
        res.status(500).json({ error: 'Lỗi kết nối AI', details: error.message });
    }
}
