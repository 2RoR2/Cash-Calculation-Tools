// Constants
const denoms = [100, 50, 20, 10, 5, 1, 0.5, 0.2, 0.1, 0.05];
const labels = ["RM100", "RM50", "RM20", "RM10", "RM5", "RM1", "50 Sen", "20 Sen", "10 Sen", "5 Sen"];
const rows = document.getElementById("rows");

// Build table rows
labels.forEach((l, i) => {
  rows.innerHTML += `<tr>
    <td>${l}</td>
    <td><input type="number" min="0" value="0" onchange="calc()" id="q${i}" inputmode="numeric"></td>
    <td>RM <span id="a${i}">0.00</span></td>
  </tr>`;
});

// Auto-resize textarea
function autoResizeTextarea(el) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

// Core functions
function calc() {
  let total = 0;
  denoms.forEach((d, i) => {
    let q = parseInt(document.getElementById("q" + i).value) || 0;
    let amt = q * d;
    document.getElementById("a" + i).innerText = amt.toFixed(2);
    total += amt;
  });
  document.getElementById("total").innerText = total.toFixed(2);
  calcOpeningCash();
}

function calcOpeningCash() {
  const total = Number(document.getElementById("total").innerText) || 0;
  const target = Number(document.getElementById("openingTarget").value) || 0;
  document.getElementById("openingTotal").innerText = total.toFixed(2);
  if (target <= 0) {
    document.getElementById("openingPlan").innerText = "Enter a target to calculate opening cash.";
    updateOpeningSummary(total, target);
    return;
  }
  updateOpeningSummary(total, target);
}

function updateOpeningSummary(total, target) {
  const cashToTakeOut = Math.max(0, total - target);
  if (target <= 0) {
    document.getElementById("cashToTakeOut").innerText = '0.00';
    document.getElementById("openingLeft").innerText = '0.00';
    document.getElementById("openingPlan").innerText = 'Enter a target to calculate opening cash.';
    return;
  }
  if (cashToTakeOut > 0) {
    document.getElementById("cashToTakeOut").innerText = cashToTakeOut.toFixed(2);
    document.getElementById("openingLeft").innerText = target.toFixed(2);
    const plan = computeTakeOutPlan(cashToTakeOut, getReceiptQuantities());
    document.getElementById("openingPlan").innerHTML = plan.length ? plan.map(item => `<div>${item}</div>`).join('') : `Take out RM ${cashToTakeOut.toFixed(2)} using available denominations.`;
  } else {
    document.getElementById("cashToTakeOut").innerText = '0.00';
    document.getElementById("openingLeft").innerText = total.toFixed(2);
    document.getElementById("openingPlan").innerText = `Target is RM ${target.toFixed(2)}; keep all RM ${total.toFixed(2)} as opening cash.`;
  }
}

function getReceiptQuantities() {
  return denoms.map((_, i) => parseInt(document.getElementById(`q${i}`).value) || 0);
}

function computeTakeOutPlan(amount, quantities) {
  let remaining = Math.round(amount * 100) / 100;
  const plan = [];
  let totalUsed = 0;
  denoms.forEach((denom, i) => {
    const available = quantities[i] || 0;
    if (!available) return;
    const count = Math.min(available, Math.floor(remaining / denom));
    if (count > 0) {
      const itemAmount = count * denom;
      plan.push(`${labels[i]} x ${count} = RM ${itemAmount.toFixed(2)}`);
      totalUsed += itemAmount;
      remaining = Math.round((remaining - itemAmount) * 100) / 100;
    }
  });
  if (Math.abs(remaining) > 0.001) {
    plan.push(`<span style="margin-top:4px;display:block;color:#c00;">Need RM ${remaining.toFixed(2)} more or adjust the target.</span>`);
  } else if (plan.length > 0) {
    plan.push(`<div style="margin-top:6px;border-top:1px solid #999;padding-top:4px;font-weight:bold;">Total: RM ${totalUsed.toFixed(2)}</div>`);
  }
  return plan;
}

function newReceiptNo(dateValue) {
  const dateStr = (dateValue || document.getElementById("date")?.value || getKuchingDate()).replace(/-/g, '');
  return "RCP-" + dateStr;
}

function updateReceiptNo() {
  const dateValue = document.getElementById("date").value || getKuchingDate();
  document.getElementById("receiptNo").innerText = newReceiptNo(dateValue);
}

function toggleCommentsDisplay() {
  const comments = document.getElementById("comments").value.trim();
  const starIcon = document.getElementById("starIcon");
  starIcon.style.display = comments.length > 0 ? 'block' : 'none';
}

function resetForm() {
  try {
    document.querySelectorAll("input[type=number]").forEach(x => x.value = 0);
    document.getElementById("comments").value = "";
    autoResizeTextarea(document.getElementById("comments"));
    document.getElementById("openingTarget").value = "0";
    document.getElementById("starIcon").style.display = "none";
    document.getElementById("date").value = getKuchingDate();
    updateDayOfWeek();
    updateReceiptNo();
    calc();
  } catch (error) {
    alert("Error resetting: " + error.message);
  }
}

// Save / Load / History
function saveReceipt() {
  try {
    calcOpeningCash();
    const data = {
      receiptNo: document.getElementById("receiptNo").innerText,
      date: document.getElementById("date").value,
      dayOfWeek: document.getElementById("dayOfWeek").innerText,
      total: document.getElementById("total").innerText,
      comments: document.getElementById("comments").value,
      qtys: denoms.map((_, i) => document.getElementById("q" + i).value)
    };
    let receipts = JSON.parse(localStorage.getItem("receipts") || "[]");
    receipts.unshift(data);
    localStorage.setItem("receipts", JSON.stringify(receipts));
    alert("Receipt saved");
    renderHistory();
  } catch (error) {
    alert("Error saving: " + (error.message || "Unknown"));
    console.error(error);
  }
}

function renderHistory() {
  try {
    let receipts = JSON.parse(localStorage.getItem("receipts") || "[]");
    let q = document.getElementById("search").value.toLowerCase();
    let html = "";
    const filtered = receipts.filter(r =>
      r.receiptNo.toLowerCase().includes(q) ||
      r.date.toLowerCase().includes(q) ||
      r.total.toLowerCase().includes(q) ||
      (r.comments && r.comments.toLowerCase().includes(q))
    );
    filtered.forEach((r, idx) => {
      const realIndex = receipts.indexOf(r);
      html += `<div class='history-item'>
        <b>${r.receiptNo}</b><br>
        ${r.date} - ${r.dayOfWeek || ""}<br>
        RM ${r.total}<br>`;
      if (r.comments) html += `<p style='font-size:11px;margin:4px 0;color:#666;font-style:italic;'>"${r.comments.substring(0, 50)}${r.comments.length > 50 ? "..." : ""}"</p>`;
      html += `<button class='btn-view' onclick='loadReceipt(${realIndex})'>View</button>
        <button class='btn-delete' onclick='deleteReceipt(${realIndex})'>Delete</button>
        </div>`;
    });
    document.getElementById("history").innerHTML = html || "<p style='color:#999;text-align:center;padding:20px;'>No receipts found</p>";
  } catch (error) {
    console.error("Render error:", error);
  }
}

function loadReceipt(index) {
  try {
    let receipts = JSON.parse(localStorage.getItem("receipts") || "[]");
    let r = receipts[index];
    document.getElementById("receiptNo").innerText = r.receiptNo;
    document.getElementById("date").value = r.date;
    document.getElementById("comments").value = r.comments || "";
    autoResizeTextarea(document.getElementById("comments"));
    document.getElementById("openingTarget").value = "0";
    updateDayOfWeek();
    updateReceiptNo();
    r.qtys.forEach((v, i) => document.getElementById("q" + i).value = v);
    calc();
    calcOpeningCash();
    toggleCommentsDisplay();
  } catch (error) {
    alert("Error loading: " + error.message);
  }
}

function deleteReceipt(index) {
  try {
    let receipts = JSON.parse(localStorage.getItem("receipts") || "[]");
    receipts.splice(index, 1);
    localStorage.setItem("receipts", JSON.stringify(receipts));
    renderHistory();
  } catch (error) {
    alert("Error deleting: " + error.message);
  }
}

// Create a clone of the receipt for export with proper comment rendering
function createExportClone() {
  const original = document.getElementById("receiptArea");
  const clone = original.cloneNode(true);
  clone.className = "receipt-export-clone";
  clone.id = "exportClone";
  
  // Remove the textarea and replace with a div showing the comment
  const textarea = clone.querySelector("#comments");
  if (textarea) {
    const commentText = textarea.value || "";
    const div = document.createElement("div");
    div.className = "comment-text";
    div.textContent = commentText;
    textarea.parentNode.replaceChild(div, textarea);
  }
  
  // Handle star icon - keep the emoji star with styling
  const starIcon = clone.querySelector("#starIcon");
  if (starIcon) {
    starIcon.className = "star-icon";
    if (!document.getElementById("comments").value.trim()) {
      starIcon.style.display = 'none';
    }
  }
  
  // Hide opening cash panel
  const openingPanel = clone.querySelector("#openingCashPanel");
  if (openingPanel) openingPanel.style.display = 'none';
  
  // Remove input fields - replace with text
  const inputs = clone.querySelectorAll("input[type=number]");
  inputs.forEach(input => {
    const td = input.parentNode;
    const value = input.value || "0";
    td.innerHTML = value;
  });
  
  // Remove date input - replace with text
  const dateInput = clone.querySelector("#date");
  if (dateInput) {
    const dateVal = dateInput.value || getKuchingDate();
    const parent = dateInput.parentNode;
    const span = document.createElement("span");
    span.textContent = dateVal;
    span.style.fontSize = "12px";
    span.style.padding = "6px 8px";
    span.style.display = "inline-block";
    parent.replaceChild(span, dateInput);
  }
  
  // Remove opening target input
  const targetInput = clone.querySelector("#openingTarget");
  if (targetInput) {
    const parent = targetInput.parentNode;
    const span = document.createElement("span");
    span.textContent = targetInput.value || "0";
    parent.replaceChild(span, targetInput);
  }
  
  // Update IDs to avoid conflicts
  clone.querySelectorAll("[id]").forEach(el => {
    el.id = el.id + "_clone";
  });
  
  return clone;
}

// Export: PDF / Image (with offline fallback)
async function savePDF() {
  try {
    // Check if libraries are loaded
    if (typeof window.jspdf === 'undefined' || typeof window.html2canvas === 'undefined') {
      alert('PDF library not loaded. Please ensure you have an internet connection to load the libraries, or use the Save function which works offline.');
      return;
    }
    
    const { jsPDF } = window.jspdf;
    
    // Create clone for export
    const clone = createExportClone();
    document.body.appendChild(clone);
    
    // Wait for clone to render
    await new Promise(r => setTimeout(r, 200));
    
    const canvas = await html2canvas(clone, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      scrollX: 0,
      scrollY: 0,
      windowWidth: clone.scrollWidth,
      windowHeight: clone.scrollHeight,
      width: clone.scrollWidth,
      height: clone.scrollHeight,
      logging: false
    });
    
    // Remove clone
    document.body.removeChild(clone);

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = canvas.height * imgWidth / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 10, position + 10, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const filename = document.getElementById("receiptNo").innerText + ".pdf";
    const blob = pdf.output("blob");

    if (navigator.canShare && navigator.share) {
      const file = new File([blob], filename, { type: "application/pdf" });
      try {
        await navigator.share({ files: [file] });
      } catch (e) {
        // user cancelled
      }
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  } catch (error) {
    alert("PDF error: " + (error.message || "try again"));
    console.error(error);
  }
}

async function saveImage() {
  try {
    // Check if libraries are loaded
    if (typeof window.html2canvas === 'undefined') {
      alert('Image library not loaded. Please ensure you have an internet connection to load the libraries, or use the Save function which works offline.');
      return;
    }
    
    // Create clone for export
    const clone = createExportClone();
    document.body.appendChild(clone);
    
    // Wait for clone to render
    await new Promise(r => setTimeout(r, 200));
    
    const canvas = await html2canvas(clone, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      scrollX: 0,
      scrollY: 0,
      windowWidth: clone.scrollWidth,
      windowHeight: clone.scrollHeight,
      width: clone.scrollWidth,
      height: clone.scrollHeight,
      logging: false
    });
    
    // Remove clone
    document.body.removeChild(clone);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = document.getElementById("receiptNo").innerText + ".png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert("Image saved");
  } catch (error) {
    alert("Image error: " + (error.message || "try again"));
    console.error(error);
  }
}

// Helpers
function getKuchingDate() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const kuching = new Date(utc + 8 * 3600000);
  const y = kuching.getFullYear();
  const m = String(kuching.getMonth() + 1).padStart(2, '0');
  const d = String(kuching.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function updateDayOfWeek() {
  const dateVal = document.getElementById("date").value;
  if (!dateVal) return;
  const [y, m, d] = dateVal.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  document.getElementById("dayOfWeek").innerText = days[date.getDay()];
  updateReceiptNo();
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("date").value = getKuchingDate();
  updateDayOfWeek();
  resetForm();
  renderHistory();
  autoResizeTextarea(document.getElementById("comments"));
  
  // Check if libraries loaded successfully
  if (typeof window.jspdf === 'undefined' || typeof window.html2canvas === 'undefined') {
    console.log('Libraries not yet loaded. The Save function will still work offline.');
  }
});