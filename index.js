const express = require("express");
const bodyParser = require("body-parser");
const { Client } = require("@notionhq/client");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 環境変数
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const PORT = process.env.PORT || 3000;

const notion = new Client({ auth: NOTION_TOKEN });

// フォームから送られたデータをNotionに追加
app.post("/add-todo", async (req, res) => {
  try {
    const タスク名 = req.body["タスク名"] || "未入力";
    const ステータス = req.body["ステータス"] || "未着手";
    const 実行日 = req.body["実行日"];
    const 時間帯 = req.body["時間帯"];
    const 期限 = req.body["期限"];

    const properties = {
      "タスク名": { title: [{ text: { content: タスク名 } }] },
      "ステータス": { status: { name: ステータス } }, // ステータス型対応
    };

    if (実行日) properties["実行日"] = { date: { start: 実行日 } };

    // 時間帯は指定の選択肢のみ送信、未入力は無視
    const allowedTimeSlots = ["⏰～09:00", "🌤09:00～13:00", "🕚13:00～18:00", "🌙18:00～"];
    if (時間帯 && allowedTimeSlots.includes(時間帯)) {
      properties["時間帯"] = { select: { name: 時間帯 } };
    }

    if (期限) properties["期限"] = { date: { start: 期限 } };

    await notion.pages.create({
      parent: { database_id: NOTION_DATABASE_ID },
      properties,
    });

    res.send("追加成功！");
  } catch (error) {
    console.error(error);
    res.status(500).send("追加失敗…");
  }
});

// テスト用フォーム
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: sans-serif;
            background-color: #f9f9f9;
          }
          form {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 20px;
            border: 1px solid #ccc;
            border-radius: 8px;
            background-color: #fff;
            width: 90%;          /* 画面幅に合わせる */
            max-width: 400px;    /* 大きい画面は最大幅 */
          }
          input, select, button {
            padding: 10px;
            font-size: 16px;     /* iPhoneでもタップしやすい */
            width: 100%;         /* 幅いっぱい */
            box-sizing: border-box;
          }
          button {
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          button:hover {
            background-color: #45a049;
          }
        </style>
      </head>
      <body>
        <form action="/add-todo" method="post">
          タスク名: <input type="text" name="タスク名">
          ステータス: 
          <select name="ステータス">
            <option value="未着手">未着手</option>
            <option value="進行中">進行中</option>
            <option value="完了">完了</option>
          </select>
          実行日: <input type="date" name="実行日">
          時間帯: 
          <select name="時間帯">
            <option value="">未入力</option>
            <option value="⏰～09:00">⏰～09:00</option>
            <option value="🌤09:00～13:00">🌤09:00～13:00</option>
            <option value="🕚13:00～18:00">🕚13:00～18:00</option>
            <option value="🌙18:00～">🌙18:00～</option>
          </select>
          期限: <input type="date" name="期限">
          <button type="submit">追加</button>
        </form>
      </body>
    </html>
  `);
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
