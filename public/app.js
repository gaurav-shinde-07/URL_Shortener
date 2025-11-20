const listEl = document.getElementById("list");
const message = document.getElementById("message");
const filterInput = document.getElementById("filter");

// Create short link
document.getElementById("createForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  message.textContent = "";

  const url = document.getElementById("url").value.trim();
  const code = document.getElementById("code").value.trim();

  if (!url) {
    message.textContent = "Please enter a URL.";
    return;
  }

  const res = await fetch("/api/links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, code: code || undefined })
  });

  const data = await res.json();

  if (!res.ok) {
    message.textContent = data.error;
    message.classList.remove("text-green-600");
    message.classList.add("text-rose-600");
    return;
  }

  message.textContent = "Created ✔";
  message.classList.remove("text-rose-600");
  message.classList.add("text-green-600");

  loadLinks();
});

// Sample button
document.getElementById("sampleBtn").addEventListener("click", () => {
  document.getElementById("url").value = "https://example.com/abc";
  document.getElementById("code").value = "exmpl1";
});

// Load links
async function loadLinks() {
  const res = await fetch("/api/links");
  const rows = await res.json();

  const term = filterInput.value.toLowerCase();
  listEl.innerHTML = "";

  rows
    .filter(
      (r) =>
        r.code.toLowerCase().includes(term) ||
        r.url.toLowerCase().includes(term)
    )
    .forEach((row) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td class="px-3 py-2 font-medium">${row.code}</td>
        <td class="px-3 py-2">
          <a href="${row.url}" target="_blank" class="text-sky-600 underline">${row.url}</a>
        </td>
        <td class="px-3 py-2">${row.clicks}</td>
        <td class="px-3 py-2">${row.last_clicked || "Never"}</td>
        <td class="px-3 py-2 space-x-2">
          <button class="text-blue-600 underline copy-btn" data-code="${row.code}">Copy</button>
          <a class="text-green-600 underline" href="/code?code=${row.code}">View</a>
          <button class="text-rose-600 underline delete-btn" data-code="${row.code}">Delete</button>
        </td>
      `;

      // Add event listeners safely (no inline JS)
      tr.querySelector(".copy-btn").addEventListener("click", (e) => {
        copy(e.target.dataset.code);
      });

      tr.querySelector(".delete-btn").addEventListener("click", (e) => {
        del(e.target.dataset.code);
      });

      listEl.appendChild(tr);
    });
}

// Copy link
function copy(code) {
  const short = `${window.location.origin}/${code}`;
  navigator.clipboard.writeText(short);
  alert("Copied: " + short);
}

// Delete link
async function del(code) {
  if (!confirm("Delete this link?")) return;

  await fetch(`/api/links/${code}`, { method: "DELETE" });
  loadLinks();
}

filterInput.addEventListener("input", loadLinks);

// Initial load
loadLinks();
