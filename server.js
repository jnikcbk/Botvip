require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors()); 
app.use(express.json()); 

const PORT = process.env.PORT || 3000;

app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const API_KEY = process.env.GEMINI_API_KEY; // Lưu key trong file .env

        // Gọi sang Google Gemini API v1beta
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
            {
                contents: [{
                    parts: [{ text: message }]
                }]
            },
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        // Cấu trúc trả về của Gemini khác OpenAI một chút
        const botReply = response.data.candidates[0].content.parts[0].text;
        res.json({ reply: botReply });

    } catch (error) {
        console.error("Lỗi Server:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Có lỗi xảy ra khi kết nối với Gemini" });
    }
});

app.listen(PORT, () => {
    console.log(`Server KaizenMC đang chạy tại http://localhost:${PORT}`);
});
