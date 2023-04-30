import { elements } from './domElements';
import { UserInfo, StatusUpdate } from './interfaces';
import { getUsers, saveUser, getCurrentUser, deleteUser, getUserByUsername } from './api';
import { getLoggedInUser as loggedInUser } from './api';

async function createUser() {
  const userName = elements.usernameInput!.value.trim();
  const password = elements.passwordInput!.value.trim();
  const selectedImage = elements.imageSelection!.value.trim();

  if (userName && password && selectedImage) {
    try {
      const existingUser = await getUserByUsername(userName); // Check if user already exists
      if (existingUser) {
        elements.errorMessage.innerHTML = "Username already exists. Please choose a different username.";
        elements.body.appendChild(elements.errorMessage);
        setTimeout(() => {
          elements.errorMessage.remove();
        }, 3000);
        return;
      }

      const newUser: UserInfo = {
        userName: userName,
        password: password,
        status: "",
        imageurl: selectedImage,
        newUser: true, // Setting newUser to true when creating a new account
        statusUpdates: [],
      };

      await saveUser(newUser);
      elements.accountCreated.innerHTML = "Account Created! Now you can login!";
      elements.body.appendChild(elements.accountCreated);
      setTimeout(() => {
        elements.accountCreated.remove();
      }, 3000);
    } catch (err) {
      console.log(err);
      elements.errorMessage.innerHTML = "Failed to create account. Try again.";
      elements.body.appendChild(elements.errorMessage);
      setTimeout(() => {
        elements.errorMessage.remove();
      }, 3000);
    }
  } else {
    elements.errorMessage.innerHTML = "Please fill in all fields.";
    elements.body.appendChild(elements.errorMessage);
    setTimeout(() => {
      elements.errorMessage.remove();
    }, 3000);
  }
}


async function loginUser() {
  const userName = elements.usernameInput!.value.trim();
  const password = elements.passwordInput!.value.trim();

  if (userName && password) {
    try {
      const users = await getUsers();
      const foundUser = users.find((user) => user.userName === userName && user.password === password);

      if (!foundUser) {
        elements.errorMessage.innerHTML = "Username does not exist. Please create an account before logging in.";
        elements.body.appendChild(elements.errorMessage);
        setTimeout(() => {
          elements.errorMessage.remove();
        }, 3000);
        return;
      }

      foundUser.newUser = false; // Set newUser to false when user logs in
      foundUser.status = "logged-in"; // Set the user's status to "logged-in"
      await saveUser(foundUser);
      localStorage.setItem("loggedInUser", foundUser.userName);
      elements.allUsersList.style.display = "block";
      elements.logInpage.style.display = "none";
      elements.container.style.display = "block";
      if (elements.currentUser) {
        elements.currentUser.textContent = `${foundUser.userName}`;
      } else {
        console.error('elements.currentUser is null');
      }

      displayLoggedInUsers();
      displayUserStatus();

    
    } catch (err) {
      console.log(err);
      elements.errorMessage.innerHTML = "Failed to log in. Try again.";
      elements.body.appendChild(elements.errorMessage);
      setTimeout(() => {
        elements.errorMessage.remove();
      }, 3000);
    }
  } else {
    elements.errorMessage.innerHTML = "Please enter a username and password.";
    elements.body.appendChild(elements.errorMessage);
    setTimeout(() => {
      elements.errorMessage.remove();
    }, 3000);
  }

  document.getElementById("logoutButton")!.style.display = "block";
  document.getElementById("delete-account-button")!.style.display = "block";
}

// To move 'container' before 'allUsersList'
elements.allUsersList!.parentNode!.insertBefore(elements.container, elements.allUsersList);

async function displayUserStatus() {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    elements.userStatus!.textContent = `${currentUser.userName}'s status: ${currentUser.status}`;
  }
}

async function addStatusUpdate() {
  const newStatus = elements.statusInput!.value.trim();

  if (newStatus) {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        if (!currentUser.statusUpdates) {
          currentUser.statusUpdates = [];
        }
        const timestamp = new Date().toISOString();
        currentUser.statusUpdates.push({ status: newStatus, timestamp: timestamp });
        await saveUser(currentUser);
        elements.statusInput!.value = "";
        // displayStatusUpdates();
        displayAllUsers();
      } else {
        elements.errorMessage.innerHTML = "Failed to find the current user.";
        elements.body.appendChild(elements.errorMessage);
        setTimeout(() => {
          elements.errorMessage.remove();
        }, 3000);
      }
    } catch (err) {
      console.log(err);
      elements.errorMessage.innerHTML = "Failed to update status. Try again.";
      elements.body.appendChild(elements.errorMessage);
      setTimeout(() => {
        elements.errorMessage.remove();
      }, 3000);
    }
  } else {
    elements.errorMessage.innerHTML = "Please enter a status update.";
    elements.body.appendChild(elements.errorMessage);
    setTimeout(() => {
      elements.errorMessage.remove();
    }, 3000);
  }
}

async function displayLoggedInUsers() {
  const users = await getUsers();
  const currentUser = await getCurrentUser();

  users.forEach(user => {
    const li = document.createElement("li");
    li.textContent = `${user.userName}:`;

    // Check that the element exists before appending the child element
    if (elements.loggedInUsersList) {
      elements.loggedInUsersList.appendChild(li);
    }
  });
}

async function displayAllUsers() {
  try {
    const allUsers = await getUsers();
    const userList = document.createElement("ul");
    allUsers.forEach((user: UserInfo) => {
      const listItem = document.createElement("li");
      listItem.classList.add("user-item");
      const latestStatus: StatusUpdate | "" = user.statusUpdates && user.statusUpdates.length > 0
        ? user.statusUpdates[user.statusUpdates.length - 1]
        : "";

      let formattedDate = '';
      if (typeof latestStatus === 'object' && latestStatus !== null) {
        const date = latestStatus.timestamp ? new Date(latestStatus.timestamp) : null;
        formattedDate = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}` : '';
      }
      
      const userImage = document.createElement('img');
      userImage.src = user.imageurl;
      userImage.width = 50; // Adjust the width as needed
      userImage.height = 50; // Adjust the height as needed
      userImage.style.marginRight = '5px';

      const userNameText = document.createTextNode(`${user.userName} - Last status: ${(typeof latestStatus === 'object' && latestStatus !== null) ? latestStatus.status : 'No status update yet'} ${formattedDate ? `(${formattedDate})` : ''}`);

      listItem.appendChild(userImage);
      listItem.appendChild(userNameText);

      listItem.addEventListener("click", () => {
        visitOtherUserPage(user.userName);
      });
      userList.appendChild(listItem);
    });
    if (elements.allUsersList) {
      elements.allUsersList.innerHTML = "";
      elements.allUsersList.appendChild(userList);
    }
  } catch (err: any) {
    console.log(err?.message ?? err);
  }
};


async function visitOtherUserPage(username: string): Promise<void> {
  const user = await getUserByUsername(username);
  document.getElementById('backButton')!.style.display = "block";
  elements.statusUpdates!.style.display = 'none'; // hide the status updates list
  const listElements = document.querySelectorAll('.user-item');
  listElements.forEach((element) => {
    (element as HTMLElement).style.display = 'none' // hide the user list items
  });
  if (!user) {
    throw new Error("User not found.");
  }

  const loggedInUsersPage = document.getElementById("container");
  const otherUserPage = document.getElementById("otherUserPage");

  if (loggedInUsersPage && otherUserPage) {
    loggedInUsersPage.style.display = "none";
    otherUserPage.style.display = "block";
    otherUserPage.querySelector(".username")!.textContent = user.userName;
    otherUserPage.querySelector(".profile-pic")!.setAttribute("src", user.imageurl);

    // Display all status updates in descending order
    const statusUpdatesContainer = otherUserPage.querySelector(".status-updates");
    if (statusUpdatesContainer) {
      statusUpdatesContainer.innerHTML = ""; // Clear previous status updates
      if (user.statusUpdates) {
        user.statusUpdates.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Sort by descending timestamp
        user.statusUpdates.forEach((statusUpdate) => {
          const statusElement = document.createElement("p");
          const date = new Date(statusUpdate.timestamp);
          const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
          statusElement.textContent = `${formattedDate}: ${statusUpdate.status}`;
          statusUpdatesContainer.appendChild(statusElement);
        });
      } else {
        const noStatusElement = document.createElement("p");
        noStatusElement.textContent = "No status update yet.";
        statusUpdatesContainer.appendChild(noStatusElement);
      }
    } else {
      console.error("Error: statusUpdatesContainer element is missing.");
    }
  } else {
    console.error("Error: loggedInUsersPage or otherUserPage element is missing.");
  }
}


function goBackToMainView() {
  const loggedInUsersPage = document.getElementById("container");
  const otherUserPage = document.getElementById("otherUserPage");
  document.getElementById('backButton')!.style.display = "none";

  if (loggedInUsersPage && otherUserPage) {
    loggedInUsersPage.style.display = "block";
    otherUserPage.style.display = "none";
    

    // Show the userListWrapper when returning to the main view
    const userListWrapper = document.getElementById("userListWrapper");
    if (userListWrapper) {
      userListWrapper.style.display = "block";
    }

    // Hide the status updates list and user list items
    elements.statusUpdates!.style.display = 'block';
    const listElements = document.querySelectorAll('.user-item');
    listElements.forEach((element) => {
      (element as HTMLElement).style.display = 'block';
    });
  } else {
    console.error("Error: loggedInUsersPage or otherUserPage element is missing.");
  }
}



async function redirectToLogin() {
  await logoutAndUpdateStatus();
  window.location.href = "/"; // Assuming your login page is at the root URL
}

document.getElementById("logoutButton")?.addEventListener("click", redirectToLogin);

async function logoutAndUpdateStatus() {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    currentUser.status = "logged-out";
    await saveUser(currentUser);
  }
  localStorage.removeItem("loggedInUser");
}

async function deleteCurrentUser() {
  const userName = elements.usernameInput!.value.trim();
  const password = elements.passwordInput!.value.trim();

  if (userName && password) {
    try {
      const users = await getUsers();

      const foundUser = users.find((user) => user.userName === userName && user.password === password);

      if (foundUser) {
        await deleteUser(foundUser.userName);
        localStorage.removeItem("loggedInUser");
        elements.userDeletedSuccessfully.innerHTML = "User deleted successfully!";
        elements.body.appendChild(elements.userDeletedSuccessfully);
        setTimeout(() => {
          elements.userDeletedSuccessfully.remove();
        }, 3000);

        // Reset the input fields and navigate back to the login page
        elements.allUsersList.style.display = "none";
        elements.usernameInput!.value = '';
        elements.passwordInput!.value = '';
        // elements.container.style.display = "none";
        elements.logInpage.style.display = "block";
        document.getElementById('otherUserPage')!.style.display = "none";
        document.getElementById('container')!.style.display = "none";
        document.getElementById('logoutButton')!.style.display = "none";
        document.getElementById('delete-account-button')!.style.display = "none";
        document.getElementById("backButton")!.style.display = "none";
  
      

        // Update the list of users and their status updates after deleting the user
        await displayAllUsers();

      } else {
        elements.failedToDeleteUser.innerHTML = "Failed to delete user. Incorrect username or password.";
        elements.body.appendChild(elements.failedToDeleteUser);
        setTimeout(() => {
          elements.failedToDeleteUser.remove();
        }, 3000);
      }
    } catch (err) {
      console.log(err);
      elements.failedToDeleteUser.innerHTML = "Failed to delete user. Try again.";
      elements.body.appendChild(elements.failedToDeleteUser);
      setTimeout(() => {
        elements.failedToDeleteUser.remove();
      }, 3000);
    }
  } else {
    elements.errorMessage.innerHTML = "Please enter a username and password.";
    elements.body.appendChild(elements.errorMessage);
    setTimeout(() => {
      elements.errorMessage.remove();
    }, 3000);
  }

  // Navigate back to the login page
  // elements.container.style.display = "none";
  // elements.logInpage.style.display = "block";
}



function setupEventListeners() {
  console.log("Create Account Button: ", elements.createAccountButton);
  console.log("Submit Button: ", elements.submitButton);
  console.log("Delete Account Button: ", elements.deleteAccountButton);
  console.log("Submit Status: ", elements.submitStatus);

  elements.createAccountButton!.addEventListener("click", () => {
    createUser();
  });

  elements.submitButton!.addEventListener("click", (event) => {
    event.preventDefault();
    loginUser();
  });

  elements.deleteAccountButton!.addEventListener("click", () => {
    deleteCurrentUser();
  });

  elements.submitStatus!.addEventListener("click", (event) => {
    event.preventDefault();
    addStatusUpdate();
  });
  const backButton = document.getElementById("backButton");
  if (backButton) {
    backButton.addEventListener("click", goBackToMainView);
  } else {
    console.error("Error: backButton element is missing.");
  }
}

async function init() {
  document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    await displayAllUsers();
  });
}

init();



