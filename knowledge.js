// Tạo một biến chứa "não bộ" của Server
const serverInfo = `
Thông tin KaizenMC:
- IP: 180.93.103.140:26666
- Admin: Minhmeo và Đăng Mạnh.
- Cách nạp xu: Truy cập mục Nạp Xu trên web.
- Lệnh cơ bản: /spawn, /sethome, /pokedex.
- Server thuộc thể loại Pixelmon (Pokémon trong Minecraft).
`;

// Trong phần fetch, sửa đoạn text gửi đi:
body: JSON.stringify({
    contents: [{
        parts: [{
            text: `Bạn là trợ lý ảo KaizenMC. Dựa vào thông tin sau: ${serverInfo}. 
                   Hãy trả lời câu hỏi: ${text}`
        }]
    }]
})
