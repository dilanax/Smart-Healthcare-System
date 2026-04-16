const state = {
    token: localStorage.getItem("adminBearerToken") || "",
    currentUser: null,
    users: []
};

const messageBanner = document.getElementById("messageBanner");
const tokenPreview = document.getElementById("tokenPreview");
const sessionStatus = document.getElementById("sessionStatus");
const usersTableWrap = document.getElementById("usersTableWrap");
const singleUserResult = document.getElementById("singleUserResult");

document.getElementById("registerForm").addEventListener("submit", handleRegister);
document.getElementById("otpForm").addEventListener("submit", handleOtpVerify);
document.getElementById("loginForm").addEventListener("submit", handleLogin);
document.getElementById("singleUserForm").addEventListener("submit", handleGetSingleUser);
document.getElementById("loadUsersButton").addEventListener("click", loadUsers);
document.getElementById("logoutButton").addEventListener("click", clearToken);

syncSessionUI();

async function handleRegister(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    await callApi("/api/auth/register", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(payload)
    }, "Account created");
    event.currentTarget.reset();
}

async function handleOtpVerify(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    await callApi("/api/auth/verify-otp", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(payload)
    }, "OTP verified");
}

async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const response = await callApi("/api/auth/login", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(payload)
    }, "Login complete");

    if (!response || !response.data) {
        return;
    }

    state.currentUser = response.data;
    state.token = response.data.accessToken || "";
    if (state.token) {
        localStorage.setItem("adminBearerToken", state.token);
    } else {
        localStorage.removeItem("adminBearerToken");
    }
    syncSessionUI();

    if (state.token) {
        showMessage("Admin Bearer token captured. You can now manage users.", true);
        await loadUsers();
    } else {
        showMessage("Login worked, but this account did not return an admin token.", false);
    }
}

async function handleGetSingleUser(event) {
    event.preventDefault();
    if (!requireToken()) {
        return;
    }

    const formData = new FormData(event.currentTarget);
    const userId = formData.get("userId");
    const response = await callApi(`/api/auth/user/${userId}`, {
        headers: authorizedJsonHeaders()
    }, "User loaded");

    if (response) {
        singleUserResult.textContent = JSON.stringify(response.data, null, 2);
    }
}

async function loadUsers() {
    if (!requireToken()) {
        return;
    }

    const response = await callApi("/api/auth/users", {
        headers: authorizedJsonHeaders()
    }, "Users loaded");

    if (!response) {
        return;
    }

    state.users = Array.isArray(response.data) ? response.data : [];
    renderUsersTable();
}

function renderUsersTable() {
    if (!state.users.length) {
        usersTableWrap.innerHTML = '<p class="empty-state">No users found yet.</p>';
        return;
    }

    const rows = state.users.map((user) => `
        <tr data-user-id="${user.userId}">
            <td><span class="badge">#${user.userId}</span></td>
            <td><input data-field="firstName" value="${escapeHtml(user.firstName || "")}"></td>
            <td><input data-field="lastName" value="${escapeHtml(user.lastName || "")}"></td>
            <td><input data-field="email" value="${escapeHtml(user.email || "")}"></td>
            <td><input data-field="phoneNumber" value="${escapeHtml(user.phoneNumber || "")}"></td>
            <td>
                <select data-field="role">
                    ${["PATIENT", "DOCTOR", "ADMIN"].map(role => `<option value="${role}" ${user.role === role ? "selected" : ""}>${role}</option>`).join("")}
                </select>
            </td>
            <td>
                <select data-field="active">
                    <option value="true" ${user.active ? "selected" : ""}>true</option>
                    <option value="false" ${!user.active ? "selected" : ""}>false</option>
                </select>
            </td>
            <td class="actions">
                <button class="primary-button" type="button" onclick="updateUser(${user.userId})">Save</button>
                <button class="danger-button" type="button" onclick="deleteUser(${user.userId})">Delete</button>
            </td>
        </tr>
    `).join("");

    usersTableWrap.innerHTML = `
        <table>
            <thead>
            <tr>
                <th>ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Active</th>
                <th>Actions</th>
            </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

async function updateUser(userId) {
    if (!requireToken()) {
        return;
    }

    const row = document.querySelector(`[data-user-id="${userId}"]`);
    const payload = {
        firstName: row.querySelector('[data-field="firstName"]').value.trim(),
        lastName: row.querySelector('[data-field="lastName"]').value.trim(),
        email: row.querySelector('[data-field="email"]').value.trim(),
        phoneNumber: row.querySelector('[data-field="phoneNumber"]').value.trim(),
        role: row.querySelector('[data-field="role"]').value,
        active: row.querySelector('[data-field="active"]').value === "true"
    };

    const response = await callApi(`/api/auth/user/${userId}`, {
        method: "PUT",
        headers: authorizedJsonHeaders(),
        body: JSON.stringify(payload)
    }, "User updated");

    if (response) {
        await loadUsers();
    }
}

async function deleteUser(userId) {
    if (!requireToken()) {
        return;
    }

    const confirmed = window.confirm(`Delete user #${userId}?`);
    if (!confirmed) {
        return;
    }

    const response = await callApi(`/api/auth/user/${userId}`, {
        method: "DELETE",
        headers: authorizedJsonHeaders()
    }, "User deleted");

    if (response) {
        await loadUsers();
    }
}

async function callApi(url, options = {}, successPrefix = "Done") {
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        const ok = response.ok && !String(data.message || "").toLowerCase().startsWith("unauthorized");
        showMessage(`${successPrefix}: ${data.message || "Request completed."}`, ok);
        return data;
    } catch (error) {
        showMessage(`Request failed: ${error.message}`, false);
        return null;
    }
}

function showMessage(message, success) {
    messageBanner.textContent = message;
    messageBanner.className = `message-banner ${success ? "success" : "error"}`;
}

function jsonHeaders() {
    return {
        "Content-Type": "application/json"
    };
}

function authorizedJsonHeaders() {
    return {
        ...jsonHeaders(),
        Authorization: `Bearer ${state.token}`
    };
}

function requireToken() {
    if (state.token) {
        return true;
    }
    showMessage("Admin login is required first so the page can use the Bearer token.", false);
    return false;
}

function clearToken() {
    state.token = "";
    state.currentUser = null;
    localStorage.removeItem("adminBearerToken");
    syncSessionUI();
    showMessage("Token cleared from this browser session.", true);
}

function syncSessionUI() {
    tokenPreview.value = state.token;
    if (state.currentUser) {
        sessionStatus.textContent = `${state.currentUser.name || state.currentUser.email} is active`;
        return;
    }
    sessionStatus.textContent = state.token ? "Stored admin token ready to use" : "Not logged in";
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

window.updateUser = updateUser;
window.deleteUser = deleteUser;
