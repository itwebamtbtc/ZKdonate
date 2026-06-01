const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyy0gtw8UORzp7TXRBQOUwymlLxRmRERQA8qob1gvSBWIz8_nHdVE_jr9WQKK-zQJr-/exec";

const form = document.getElementById("donationForm");
const payBtn = document.getElementById("payBtn");
const loadingMsg = document.getElementById("loadingMsg");
const receiptFields = document.getElementById("receiptFields");
const receiptTitleInput = document.getElementById("receiptTitle");
const receiptAddressInput = document.getElementById("receiptAddress");

document.querySelectorAll('input[name="receiptOption"]').forEach((input) => {
  input.addEventListener("change", () => {
    const shouldMailReceipt = document.querySelector('input[name="receiptOption"]:checked').value === "mail";
    receiptFields.hidden = !shouldMailReceipt;
    receiptTitleInput.required = shouldMailReceipt;
    receiptAddressInput.required = shouldMailReceipt;

    if (!shouldMailReceipt) {
      receiptTitleInput.value = "";
      receiptAddressInput.value = "";
    }
  });
});

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
  const receiptRequired = document.querySelector('input[name="receiptOption"]:checked').value === "mail";
  const receiptTitle = receiptTitleInput.value.trim();
  const receiptAddress = receiptAddressInput.value.trim();

  if (!Number.isInteger(amount) || amount < 1) {
    alert("請輸入正確的捐款金額。");
    return;
  }

  if (!category || !email || !phone) {
    alert("請填寫必填欄位。");
    return;
  }

  if (receiptRequired && (!receiptTitle || !receiptAddress)) {
    alert("索取紙本收據時，請填寫收據抬頭與收件地址。");
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
        message,
        receiptRequired,
        receiptTitle,
        receiptAddress
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
