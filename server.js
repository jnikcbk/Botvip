import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const API_KEY = "API_KEY_CỦA_BẠN";

app.post("/ai", async (req,res)=>{

const msg = req.body.message;

const r = await fetch("https://api.openai.com/v1/chat/completions",{
method:"POST",
headers:{
"Content-Type":"application/json",
"Authorization":"Bearer "+API_KEY
},
body:JSON.stringify({
model:"gpt-4o-mini",
messages:[{role:"user",content:msg}]
})
});

const data = await r.json();
res.json(data);

});

app.listen(3000,()=>{
console.log("Server chạy ở http://localhost:3000");
});
