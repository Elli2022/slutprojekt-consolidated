//Importerar de nödvändiga DOM-elementen och gränssnitten från respektive moduler
import { elements } from "./domElements";
import { UserInfo, StatusUpdate } from "./interfaces";
import {
  getUsers,
  saveUser,
  getCurrentUser,
  deleteUser,
  getUserByUsername,
} from "./api";

// funktion för att skapa en ny användare
async function createUser() {
  // hämtar värdena för användarnamn, lösenord och vald bild från inputfälten
  const userName = elements.usernameInput!.value.trim();
  const password = elements.passwordInput!.value.trim();
  const selectedImage = elements.imageSelection!.value.trim();

  if (userName && password && selectedImage) {
    try {
      // kontrollerar om användarnamnet redan finns
      const existingUser = await getUserByUsername(userName);
      if (existingUser) {
        // visar felmeddelande om användarnamnet redan finns
        elements.errorMessage.innerHTML =
          "Username already exists. Please choose a different username.";
        elements.body.appendChild(elements.errorMessage);
        setTimeout(() => {
          elements.errorMessage.remove();
        }, 3000);
        return;
      }

      // skapar ett nytt användarobjekt
      const newUser: UserInfo = {
        userName: userName,
        password: password,
        status: "",
        imageurl: selectedImage,
        newUser: true,
        statusUpdates: [],
      };

      //Sparar den nya användaren
      await saveUser(newUser);
      // visar meddelande om att kontot har skapats
      elements.accountCreated.innerHTML = "Account Created! Now you can login!";
      elements.body.appendChild(elements.accountCreated);
      setTimeout(() => {
        elements.accountCreated.remove();
      }, 1500);
    } catch (err) {
      // Loggar fel och visar felmeddelande om kontot inte kunde skapas
      console.log(err);
      elements.errorMessage.innerHTML = "Failed to create account. Try again.";
      elements.body.appendChild(elements.errorMessage);
      setTimeout(() => {
        elements.errorMessage.remove();
      }, 3000);
    }
  } else {
    // Visar felmeddelande om något fält är tomt
    elements.errorMessage.innerHTML = "Please fill in all fields.";
    elements.body.appendChild(elements.errorMessage);
    setTimeout(() => {
      elements.errorMessage.remove();
    }, 3000);
  }
}

// Funktion för att logga in en användare
async function loginUser() {
  // Hämtar användarnamn och lösenord från inputfälten
  const userName = elements.usernameInput!.value.trim();
  const password = elements.passwordInput!.value.trim();

  //Kontrollerar att både användarnamn och lösenord är angivna
  if (userName && password) {
    try {
      //hämtar alla användare och letar upp användaren med matchande användarnamn och lösenord
      const users = await getUsers();
      const foundUser = users.find(
        (user) => user.userName === userName && user.password === password
      );

      // Om användaren inte hittas visas felmeddelande
      if (!foundUser) {
        elements.errorMessage.innerHTML =
          "Username does not exist. Please create an account before logging in.";
        elements.body.appendChild(elements.errorMessage);
        setTimeout(() => {
          elements.errorMessage.remove();
        }, 3000);
        return;
      }

      //markerar användaren som inte längre ny och uppdaterar statusen till "logged-in"
      foundUser.newUser = false;
      foundUser.status = "logged-in";

      //sparar användaren med de uppdaterade egenskaperna
      await saveUser(foundUser);

      // Sparar användarnamnet för den inloggade användaren i localStorage
      localStorage.setItem("loggedInUser", foundUser.userName);

      // visar listan över alla användare gömmer inloggningssidan och visar huvudsidan
      elements.allUsersList.style.display = "block";
      elements.logInpage.style.display = "none";
      elements.container.style.display = "block";

      // Visar det aktuella användarnamnet på sidan
      if (elements.currentUser) {
        elements.currentUser.textContent = `${foundUser.userName}`;
      } else {
        console.error("elements.currentUser is null");
      }

      //Visar de inloggade användarna och användarens status
      displayLoggedInUsers();
      displayUserStatus();

      //hantering av fel vid inloggning
    } catch (err) {
      console.log(err);
      elements.errorMessage.innerHTML = "Failed to log in. Try again.";
      elements.body.appendChild(elements.errorMessage);
      setTimeout(() => {
        elements.errorMessage.remove();
      }, 3000);
    }
    // Hanterar vid inloggning tomma fält om en användare försöker logga in 
  } else {
    elements.errorMessage.innerHTML = "Please enter a username and password.";
    elements.body.appendChild(elements.errorMessage);
    setTimeout(() => {
      elements.errorMessage.remove();
    }, 3000);
  }

  // Visar "Logga ut" och "Radera konto" knapparna
  document.getElementById("logoutButton")!.style.display = "block";
  document.getElementById("delete-account-button")!.style.display = "block";
}

// Lägger till huvudsidan före listan över alla användare i DOM:en
elements.allUsersList!.parentNode!.insertBefore(
  elements.container,
  elements.allUsersList
);

// Funktion som visar användarens status
async function displayUserStatus() {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    elements.userStatus!.textContent = `${currentUser.userName}'s status: ${currentUser.status}`;
  }
}

//Funktion för att lägga till en ny statusuppdatering
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
        currentUser.statusUpdates.push({
          status: newStatus,
          timestamp: timestamp,
        });
        await saveUser(currentUser);
        elements.statusInput!.value = "";
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

// Funktion för att visa inloggade användare
async function displayLoggedInUsers() {
  const users = await getUsers();
  const currentUser = await getCurrentUser();

  users.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = `${user.userName}:`;

    if (elements.loggedInUsersList) {
      elements.loggedInUsersList.appendChild(li);
    }
  });
}

// Funktion för att visa alla användare med deras senaste statusuppdateringar och profilbilder
async function displayAllUsers() {
  try {
    const allUsers = await getUsers();
    const userList = document.createElement("ul");
    allUsers.forEach((user: UserInfo) => {
      const listItem = document.createElement("li");
      listItem.classList.add("user-item");
      const latestStatus: StatusUpdate | "" =
        user.statusUpdates && user.statusUpdates.length > 0
          ? user.statusUpdates[user.statusUpdates.length - 1]
          : "";

      // Formaterar datumet för den senaste statusuppdateringen
      let formattedDate = "";
      if (typeof latestStatus === "object" && latestStatus !== null) {
        const date = latestStatus.timestamp
          ? new Date(latestStatus.timestamp)
          : null;
        formattedDate = date
          ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
              2,
              "0"
            )}-${String(date.getDate()).padStart(2, "0")} ${String(
              date.getHours()
            ).padStart(2, "0")}:${String(date.getMinutes()).padStart(
              2,
              "0"
            )}:${String(date.getSeconds()).padStart(2, "0")}`
          : "";
      }

      // Skapar användarens profilbild
      const userImage = document.createElement("img");
      userImage.src = user.imageurl;
      userImage.width = 50;
      userImage.height = 50;
      userImage.style.marginRight = "5px";

      // Skapar textnoden för användarnamnet och statusuppdateringen
      const userNameText = document.createTextNode(
        `${user.userName} - Last status: ${
          typeof latestStatus === "object" && latestStatus !== null
            ? latestStatus.status
            : "No status update yet"
        } ${formattedDate ? `(${formattedDate})` : ""}`
      );

      listItem.appendChild(userImage);
      listItem.appendChild(userNameText);

      // Lägg er till en eventlistener för att besöka den andra användarens sida
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
}

// Funktion för att besöka en annan användares sida och visa deras statusuppdateringar
async function visitOtherUserPage(username: string): Promise<void> {
  // hämtar användaren med det angivna användarnamnet
  const user = await getUserByUsername(username);

  // Visar tillbakaknappen och döljer statusuppdateringar och användarlistan
  document.getElementById("backButton")!.style.display = "block";
  elements.statusUpdates!.style.display = "none";
  const listElements = document.querySelectorAll(".user-item");
  listElements.forEach((element) => {
    (element as HTMLElement).style.display = "none";
  });

  // om användaren inte hittas så visas ett fel där det står att användaren unte hittas
  if (!user) {
    throw new Error("User not found.");
  }

  // Hämtar nödvändiga element för att visa den andra användarens sida
  const loggedInUsersPage = document.getElementById("container");
  const otherUserPage = document.getElementById("otherUserPage");

  // Om elementen finns uppdateras sidan med den andra användarens information
  if (loggedInUsersPage && otherUserPage) {
    loggedInUsersPage.style.display = "none";
    otherUserPage.style.display = "block";
    otherUserPage.querySelector(".username")!.textContent = user.userName;
    otherUserPage
      .querySelector(".profile-pic")!
      .setAttribute("src", user.imageurl);

    // Hämtar statusuppdateringarnas "container" från otherUserPage
    const statusUpdatesContainer =
      otherUserPage.querySelector(".status-updates");

    // Om statusUpdatesContainer finns
    if (statusUpdatesContainer) {
      // Rensar statusUpdatesContainer
      statusUpdatesContainer.innerHTML = "";

      // Om användaren har statusuppdateringar
      if (user.statusUpdates) {
        // Sorterar statusuppdateringar i fallande ordning baserat på tidsstämpel
        user.statusUpdates.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // Loopar igenom varje statusuppdatering
        user.statusUpdates.forEach((statusUpdate) => {
          // Skapar ett nytt p element för varje statusuppdatering
          const statusElement = document.createElement("p");

          // Formaterar datumet för statusuppdateringen
          const date = new Date(statusUpdate.timestamp);
          const formattedDate = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}-${String(date.getDate()).padStart(
            2,
            "0"
          )} ${String(date.getHours()).padStart(2, "0")}:${String(
            date.getMinutes()
          ).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;

          // Anger textinnehållet i statusElement som statusuppdateringens formaterade datum och status
          statusElement.textContent = `${formattedDate}: ${statusUpdate.status}`;

          // Lägger till statusElement i statusUpdatesContainer
          statusUpdatesContainer.appendChild(statusElement);
        });
      } else {
        // Om användaren inte har några statusuppdateringar skapas ett p element med textinnehållet "No status update yet."
        const noStatusElement = document.createElement("p");
        noStatusElement.textContent = "No status update yet.";

        // Lägger till noStatusElement i statusUpdatesContainer
        statusUpdatesContainer.appendChild(noStatusElement);
      }
    } else {
      console.error("Error: statusUpdatesContainer element is missing.");
    }
  } else {
    // Om statusUpdatesContainer inte hittades loggas ett felmeddelande i konsolen
    console.error(
      "Error: loggedInUsersPage or otherUserPage element is missing."
    );
  }
}

// Funktion för att återgå till huvudvyn
function goBackToMainView() {
  // Hämtar element för inloggade användares sida och andra användarens sida
  const loggedInUsersPage = document.getElementById("container");
  const otherUserPage = document.getElementById("otherUserPage");

  // Döljer tillbaka-knappen
  document.getElementById("backButton")!.style.display = "none";

  // Visar huvudsidan och döljer den andra användarens sida
  if (loggedInUsersPage && otherUserPage) {
    loggedInUsersPage.style.display = "block";
    otherUserPage.style.display = "none";

    // Visar användarlistan
    const userListWrapper = document.getElementById("userListWrapper");
    if (userListWrapper) {
      userListWrapper.style.display = "block";
    }

    // Visar statusuppdateringar och användarlistelement
    elements.statusUpdates!.style.display = "block";
    const listElements = document.querySelectorAll(".user-item");
    listElements.forEach((element) => {
      (element as HTMLElement).style.display = "block";
    });
  } else {
    console.error(
      "Error: loggedInUsersPage or otherUserPage element is missing."
    );
  }
}

// Kontrollerar om en användare är inloggad
async function checkIfUserIsLoggedIn() {
  // Hämtar den inloggade användarens användarnamn från localStorage
  const loggedInUserName = localStorage.getItem("loggedInUser");

  // Om det finns en inloggad användare
  if (loggedInUserName) {
    // Hämtar användaren med användarnamnet
    const foundUser = await getUserByUsername(loggedInUserName);

    // Om användaren hittades och statusen är "logged-in"
    if (foundUser && foundUser.status === "logged-in") {
      // Gömmer inloggningssidan och visar användarlistan och huvudsidan
      elements.logInpage.style.display = "none";
      elements.allUsersList.style.display = "block";
      elements.container.style.display = "block";

      //uppdaterar det aktuella användarnamnet i sidhuvudet
      if (elements.currentUser) {
        elements.currentUser.textContent = `${foundUser.userName}`;
      } else {
        console.error("elements.currentUser is null");
      }

      //visar inloggade användare och användarstatus
      displayLoggedInUsers();
      displayUserStatus();

      // visar utloggning och radera konto-knapparna
      document.getElementById("logoutButton")!.style.display = "block";
      document.getElementById("delete-account-button")!.style.display = "block";
    }
  }
}

// Funktion för att omdirigera till inloggningssidan efter utloggning
async function redirectToLogin() {
  // Log out and update user status
  await logoutAndUpdateStatus().then(() => {
    // Dynamically build the correct path based on the current URL
    const basePath = window.location.pathname.split('/').slice(0, -1).join('/');
    location.assign(`${basePath}/index.html`);
  });
}


  //omdirigerar användaren till hemsidan (inloggningssidan)
   
  
}

// Lägger till en eventlistener för utloggning
document
  .getElementById("logoutButton")
  ?.addEventListener("click", redirectToLogin);

// Funktion för att logga ut och uppdatera användarstatus
async function logoutAndUpdateStatus() {
  // Hämta den aktuella användaren
  const currentUser = await getCurrentUser();
  if (currentUser) {
    // Ändrar användarstatus till "logged-out"
    currentUser.status = "logged-out";

    // Sparar användaren med den uppdaterade statusen
    await saveUser(currentUser);
  }

  // Tar bort den inloggade användaren från localStorage
  localStorage.removeItem("loggedInUser");
}

// Funktion för att radera den aktuella användaren
async function deleteCurrentUser() {
  // Hämtar användarnamn och lösenord från formuläret
  const userName = elements.usernameInput!.value.trim();
  const password = elements.passwordInput!.value.trim();

  //om både användarnamn och lösenord anges
  if (userName && password) {
    try {
      //hämtas alla användare
      const users = await getUsers();

      //hittar användaren med matchande användarnamn och lösenord
      const foundUser = users.find(
        (user) => user.userName === userName && user.password === password
      );

      // Om användaren hittades
      if (foundUser) {
        // Raderar användaren
        await deleteUser(foundUser.userName);

        // Tar bort den inloggade användaren från localStorage
        localStorage.removeItem("loggedInUser");

        // Visar meddelande om att användaren har raderats
        elements.userDeletedSuccessfully.innerHTML =
          "User deleted successfully!";
        elements.body.appendChild(elements.userDeletedSuccessfully);
        setTimeout(() => {
          elements.userDeletedSuccessfully.remove();
        }, 3000);

        // Uppdaterar gränssnittet för att visa inloggningssidan och döljer andra element
        elements.allUsersList.style.display = "none";
        elements.usernameInput!.value = "";
        elements.passwordInput!.value = "";
        elements.logInpage.style.display = "block";
        document.getElementById("otherUserPage")!.style.display = "none";
        document.getElementById("container")!.style.display = "none";
        document.getElementById("logoutButton")!.style.display = "none";
        document.getElementById("delete-account-button")!.style.display =
          "none";
        document.getElementById("backButton")!.style.display = "none";

        //Hämtar och visar alla användare igen
        await displayAllUsers();
      } else {
        // Visar felmeddelande om felaktigt användarnamn eller lösenord
        elements.failedToDeleteUser.innerHTML =
          "Failed to delete user. Incorrect username or password.";
        elements.body.appendChild(elements.failedToDeleteUser);
        setTimeout(() => {
          elements.failedToDeleteUser.remove();
        }, 3000);
      }
    } catch (err) {
      // Visar felmeddelande om något gick fel
      console.log(err);
      elements.failedToDeleteUser.innerHTML =
        "Failed to delete user. Try again.";
      elements.body.appendChild(elements.failedToDeleteUser);
      setTimeout(() => {
        elements.failedToDeleteUser.remove();
      }, 3000);
    }
    //om användarnamn och lösenord inte är angivna
  } else {
    //visa ett felmeddelande om användarnamn och lösenord saknas
    elements.errorMessage.innerHTML = "Please enter a username and password.";
    elements.body.appendChild(elements.errorMessage);
    setTimeout(() => {
      elements.errorMessage.remove();
    }, 3000);
  }
}

// funktion för att konfigurera eventlistener för knappar och formulär
function setupEventListeners() {
  // lägger till eventlistener för konto-skapande-knappen
  elements.createAccountButton!.addEventListener("click", () => {
    createUser();
  });

  // Lägger till eventlistener för inloggningsknappen
  elements.submitButton!.addEventListener("click", (event) => {
    event.preventDefault();
    loginUser();
  });

  // Lägger till eventlistener för radera-konto-knappen
  elements.deleteAccountButton!.addEventListener("click", () => {
    deleteCurrentUser();
  });

  // Lägger till eventlistener för statusuppdateringsknappen
  elements.submitStatus!.addEventListener("click", (event) => {
    event.preventDefault();
    addStatusUpdate();
  });

  // Lägger till eventlistener  för tillbaka-knappen om den finns
  const backButton = document.getElementById("backButton");
  if (backButton) {
    backButton.addEventListener("click", goBackToMainView);
  } else {
    // Visar felmeddelande om tillbaka-knappen saknas
    console.error("Error: backButton element is missing.");
  }
}

// Init-funktion som körs när sidan laddas
async function init() {
  // Väntar tills sidan har laddats
  document.addEventListener("DOMContentLoaded", async () => {
    //konfigurerar eventlisteners
    setupEventListeners();

    //visar alla användare
    await displayAllUsers();

    //kontrollerar om en användare är inloggad
    await checkIfUserIsLoggedIn();
  });
}

//startar init-funktionen
init();
