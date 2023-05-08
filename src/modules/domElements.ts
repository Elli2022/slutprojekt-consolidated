export const elements = {
    logInpage: document.getElementById('logInpage') as HTMLDivElement,
    container: document.getElementById('container') as HTMLDivElement,
    body: document.getElementById('body') as HTMLBodyElement,
    imageSelection: document.getElementById("image-selection") as HTMLSelectElement | null,
    createAccountButton: document.getElementById("create-account-button") as HTMLButtonElement | null,
    submitButton: document.getElementById("submit-button") as HTMLButtonElement | null,
    usernameInput: document.getElementById("username") as HTMLInputElement | null,
    passwordInput: document.getElementById("password") as HTMLInputElement | null,
    errorMessage: document.createElement("p"),
    userDeletedSuccessfully: document.createElement('h1'),
    failedToDeleteUser: document.createElement('h1'),
    accountCreated: document.createElement("h1"),
    currentUser: document.getElementById("current-user") as HTMLHeadingElement | null,
    statusUpdates: document.getElementById("status-updates") as HTMLUListElement | null,
    loggedInUsersList: document.querySelector('.js-logged-in-users-list') as HTMLElement,
    deleteAccountButton: document.getElementById("delete-account-button") as HTMLButtonElement | null,
    statusInput: document.getElementById("status-input") as HTMLInputElement | null,
    submitStatus: document.getElementById("submit-status") as HTMLButtonElement,
    allUsersList: document.getElementById("allUsersList") as HTMLUListElement,
    userStatus: document.getElementById('userStatus') as HTMLElement,
};

if (elements.logInpage) {
    elements.logInpage.style.display = "block";
}

elements.container.style.display = "none";
elements.body.appendChild(elements.container);

const errorMessage = document.createElement("div");
errorMessage.className = "error-message";
