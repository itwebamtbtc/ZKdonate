// ============================================================
// 慈光圖書館捐款前端 - GAS 串接設定
// ============================================================
// 請在 Google Apps Script 部署後，將您的 Web App URL 填入下方：
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwctIVLKsokg6s_MnUsjz3-7j-C4vQzR4ErL8p0wNcM1q5xQ5PppUygAaeMgGk3NvhU/exec";
// 例如：https://script.google.com/macros/s/AKfycby.../exec

document.getElementById('donationForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const amt = parseInt(document.getElementById('amt').value, 10);
    const itemDesc = document.getElementById('itemDesc').value.trim();
    const payBtn = document.getElementById('payBtn');
    const loadingMsg = document.getElementById('loadingMsg');

    if (!email || !amt || amt < 1) {
        alert("請確認填寫正確的捐款金額與 Email！");
        return;
    }

    if (GAS_WEB_APP_URL.includes("在此處填入")) {
        alert("錯誤：您還沒有設定 GAS_WEB_APP_URL！\n請打開 frontend/app.js，將第 5 行替換為您的 GAS 網頁應用程式網址。");
        return;
    }

    // 鎖定按鈕防止重複送出
    payBtn.disabled = true;
    loadingMsg.style.display = 'block';

    try {
        // 注意：使用 text/plain 作為 Content-Type，
        // 這是繞過 GAS CORS 預檢請求的標準做法。
        // GAS 後端 (Code.gs) 已對應處理此格式。
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'createOrder',
                email: email,
                amt: amt,
                itemDesc: itemDesc
            })
        });

        const result = await response.json();

        if (result.status === 'success') {
            // 動態建立隱藏表單，提交至藍新金流
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = result.payUrl;

            const fields = {
                MerchantID: result.MerchantID,
                TradeInfo: result.TradeInfo,
                TradeSha: result.TradeSha,
                Version: result.Version
            };

            for (const [key, value] of Object.entries(fields)) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value;
                form.appendChild(input);
            }

            document.body.appendChild(form);
            form.submit(); // 跳轉至藍新金流刷卡頁面
        } else {
            alert("後端回報錯誤：" + (result.message || '未知錯誤'));
            payBtn.disabled = false;
            loadingMsg.style.display = 'none';
        }
    } catch (err) {
        console.error("Fetch error:", err);
        alert("連線發生錯誤，請檢查您的網路或後端網址是否正確。\n錯誤詳情：" + err.message);
        payBtn.disabled = false;
        loadingMsg.style.display = 'none';
    }
});
