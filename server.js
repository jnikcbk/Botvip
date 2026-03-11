require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors()); // Cho phép Frontend truy cập
app.use(express.json()); // Đọc được dữ liệu JSON gửi lên

const PORT = process.env.PORT || 3000;

app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: message }],
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                },
            }
        );

        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) {
        console.error("Lỗi Server:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Có lỗi xảy ra khi kết nối với AI" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});
