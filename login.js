/*

בדף הזה יש את הלוגיקה של ההתחברות
אנחנו בעצם ניגשים לאלמנטים ספציפיים בדף של הלוגין ומוסיפים להם פונקציונליות
const form = document.getElementById('loginForm');
בשורה הנל אנחנו בעצם ניגשים לטופס הלוגין בדף הלוגין ולאחר מכן אנחנו יכולים להוסיף לו לוגיקה
נוכל להשתמש במשתנה
form
.כדי להוסיף לוגיקה לשליחת האינפוטים של שם משתמש וסיסמה וטופס ההתחברות
אנחנו נגשים גם לאלמנטים של שם משתמש וסיסמה, מחלצים את הערכים מהם
ואז שולחים אותם לשרת על מנת שהוא יבצע בדיקה האם השם משתמש והסיסמה נכונים
במידה והשם משתמש והסיסמה נכונים- אנחנו עוברים לדף הבית
במידה והם לא נכונים, תופיע הודעה מתאימה על המסף

שליחת האינפוטים לשרת מתבצעת באמצעות הפונקציה:
fetch

*/

window.addEventListener("DOMContentLoaded", (event) => {
  const form = document.getElementById("loginForm");
  form.addEventListener("submit", (event) => {
    event.preventDefault(); // Prevent the form from submitting

    // Get the values from the form fields
    const username = document.getElementById("username").value.toLowerCase();
    const password = document.getElementById("password").value;
    
    // Send a POST request to the server with the login data
    fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          if (data.userType === "admin") {
            // Redirect to admin window
            window.location.href = "/admin";
          } else {
            // Redirect to user window
            window.location.href = `/:${username}`;
          }
        } else {
          // Display an error message
          const message = document.getElementById("message");
          message.textContent = "Invalid username or password.";
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });
});
