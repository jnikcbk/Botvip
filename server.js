require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
// Nạp não bộ từ file knowledge.js
const serverInfo = require('./knowledge'); 

const app = express();
app.use(cors());
app.use(express.json());

app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const API_KEY = process.env.GEMINI_API_KEY;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
            {
                contents: [{
                    parts: [{ 
                        // Gộp não bộ và câu hỏi của người chơi lại
                        text: `${serverInfo}\n\nNgười chơi hỏi: ${message}` 
                    }]
                }]
            }
        );

        const botReply = response.data.candidates[0].content.parts[0].text;
        res.json({ reply: botReply });

    } catch (error) {
        console.error("Lỗi:", error.message);
        res.status(500).json({ error: "Lỗi kết nối AI" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chạy tại port ${PORT}`));
