const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxkMvsUMT7SlmyBxH3XSAlWrEks_L8KSmdDCJlCrCA-EgqhNsIxolnyqipJpp_sqtBu/exec";

const form = document.getElementById("donationForm");
const payBtn = document.getElementById("payBtn");
const loadingMsg = document.getElementById("loadingMsg");

function setLoading(isLoading) {
  payBtn.disabled = isLoading;
  loadingMsg.hidden = !isLoading;
}

function postToNewebPay(payload) {
  const paymentForm = document.createElement("form");
  paymentForm.method = "POST";
  paymentForm.action = payload.payUrl;
  paymentForm.style.display = "none";

  ["MerchantID", "TradeInfo", "TradeSha", "Version"].forEach((fieldName) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = fieldName;
    input.value = payload[fieldName] || "";
    paymentForm.appendChild(input);
  });

  document.body.appendChild(paymentForm);
  paymentForm.submit();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const amount = Number.parseInt(document.getElementById("amt").value, 10);
  const category = document.getElementById("category").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!Number.isInteger(amount) || amount < 1) {
    alert("請輸入正確的捐款金額。");
    return;
  }

  if (!category || !email || !phone) {
    alert("請填寫必填欄位。");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "createOrder",
        amt: amount,
        category,
        email,
        phone,
        message
      })
    });

    const result = await response.json();

    if (!response.ok || result.status !== "success") {
      throw new Error(result.message || "建立付款資料失敗，請稍後再試。");
    }

    postToNewebPay(result);
  } catch (error) {
    console.error("Create payment failed:", error);
    alert(error.message || "目前無法建立付款資料，請稍後再試。");
    setLoading(false);
  }
});
