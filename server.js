/*

בקובץ הזה יש את כל הפונקציונליות של השרת
כרגע יש בו רק א הלוגיקה של הרצת השרת בכתובת
http://localhost:3000
כשהדף הראשון שמגיעים אליו הוא דף ההתחברות
ורק לאחר התחברות מגיעים לדף הבית (בהתאם לאדמין ומשתמש רגיל)
כרגע ניתן לראות שיש כאן פונקציה שמטפלת בהתחברות
app.post('/login', (req, res) => {

בהמשך כשאחבר את הפרויקט למונגו אז אני אוסיף לפונקציה הזו לוגיקה שתבדוק מול הפרטים שבמונגו
האם שם המשתמש והסיסמה שהוזנו נכונים
npm i path 
*/

const path = require("path");
const express = require("express");
const { MongoClient } = require("mongodb");
// const userManagement = require("express-user-management");
const app = express();

// Serve static files from the "public" directory
app.use(express.static("public"));

// Parse JSON request bodies
app.use(express.json());

// MongoDB configuration
const mongoURI = "mongodb://localhost:27017";
const dbName = "colmanBankApp";
const usersCollection = "users";
const accountsCollection = "accounts";

// Connect to MongoDB
let db;

MongoClient.connect(mongoURI, { useUnifiedTopology: true })
  .then((client) => {
    db = client.db(dbName);
    console.log("Connected to MongoDB");

    // Set up collection references
    const users = db.collection(usersCollection);
    const accounts = db.collection(accountsCollection);

    // Save admin details if not already present in the database
    db.collection(usersCollection)
      .findOne({ type: "admin" })
      .then((admin) => {
        if (!admin) {
          const adminUser = {
            username: "admin",
            password: "password",
            type: "admin",
            accountNumber: null
          };
          db.collection(usersCollection)
            .insertOne(adminUser)
            .then(() => {
              console.log("Admin details saved in the database");
            })
            .catch((error) => {
              console.error("Error saving admin details:", error);
            });
        }
      })
      .catch((error) => {
        console.error("Error checking admin details:", error);
      });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

// // User management configuration
// const userManagementConfig = {
//   database: db,
//   collectionName: usersCollectionName,
//   userFields: ["username", "password", "type"],
// };

// // Initialize user management middleware
// app.use(userManagement(userManagementConfig));

// Handle the login POST request
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Find the user in the MongoDB collection
  db.collection(usersCollection)
    .findOne({ username, password })
    .then((user) => {
      if (user) {
        res.json({ success: true, userType: user.type, username: username });
      } else {
        res.json({ success: false });
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      res.json({ success: false });
    });
});

// Handle add user
app.post('/addUser', (req, res) => {
  const { username, password, userType } = req.body;

  // Set up collection references
  const users = db.collection(usersCollection);
  const accounts = db.collection(accountsCollection);

  // Check if the user already exists
  users.findOne({ username })
    .then((existingUser) => {
      if (existingUser) {
        return res.json({ success: false, message: 'User already exists.' });
      }

      if (userType === 'user') {
        // Generate account number for regular user
        accounts.countDocuments()
          .then((count) => {
            const accountNumber = (count + 1).toString();

            const newUser = {
              username,
              password,
              type: userType,
              bankAccountNumber: accountNumber
            };

            const newAccount = {
              accountNumber,
              username,
              accountMovements: [],
              balance: Math.floor(Math.random() * 5000)
            };

            Promise.all([
              users.insertOne(newUser),
              accounts.insertOne(newAccount)
            ])
              .then(() => {
                return res.json({ success: true });
              })
              .catch((error) => {
                console.error('Error adding user and account:', error);
                return res.json({ success: false });
              });
          })
          .catch((error) => {
            console.error('Error generating account number:', error);
            return res.json({ success: false });
          });
      } else {
        // Add admin user without bank account number
        const newUser = {
          username,
          password,
          type: userType
        };

        users.insertOne(newUser)
          .then(() => {
            return res.json({ success: true });
          })
          .catch((error) => {
            console.error('Error adding user:', error);
            return res.json({ success: false });
          });
      }
    })
    .catch((error) => {
      console.error('Error finding user:', error);
      return res.json({ success: false });
    });
});

// Handle remove user
app.post('/removeUser', (req, res) => {
  const { accountNumber } = req.body;

  // Set up collection references
  const users = db.collection(usersCollection);
  const accounts = db.collection(accountsCollection);

  users.deleteOne({ bankAccountNumber: accountNumber })
    .then(() => {
      accounts.deleteOne({ accountNumber: accountNumber }) 
        .then(() => {
          return res.json({ success: true });
        })
        .catch((error) => {
          console.error('Error removing account:', error);
          return res.json({ success: false });
        });
    })
    .catch((error) => {
      console.error('Error removing user:', error);
      return res.json({ success: false });
    });
});

// Handle get accounts
app.get('/accounts', (req, res) => {
  // Set up collection references
  const accounts = db.collection(accountsCollection);

  accounts.find().toArray()
    .then((accounts) => {
      return res.json({ success: true, accounts });
    })
    .catch((error) => {
      console.error('Error retrieving accounts:', error);
      return res.json({ success: false });
    });
});

// Handle user page requests
app.get('/user/:username', (req, res) => {
  const username = req.params.username.replace(":", "");

  // Set up collection references
  const users = db.collection(usersCollection);
  const accounts = db.collection(accountsCollection);

  // Retrieve account information for the user
  users.findOne({ username })
    .then((user) => {
      if (!user) {
        return res.status(404).send('User not found.');
      }

      if (user.type !== 'user') {
        return res.status(403).send('Access denied.');
      }

      const accountNumber = user.bankAccountNumber;
      
      // Retrieve account balance and transactions
      accounts.findOne({ accountNumber })
        .then((account) => {
          if (!account) {
            return res.status(404).send('Account not found.');
          }

          const balance = account.balance;
          const transactions = account.accountMovements;

          return res.json({ 
            success: true,
            username: username, 
            balance: balance, 
            transactions: transactions 
          })
        })
        .catch((error) => {
          console.error('Error retrieving account data:', error);
          return res.status(500).send('Internal server error.');
        });
    })
    .catch((error) => {
      console.error('Error retrieving user:', error);
      return res.status(500).send('Internal server error.');
    });
});

// Handle bank transfer
app.post('/transfer', (req, res) => {
  const { username, recipientUsername, recipientAccountNumber, amount } = req.body;

  // Set up collection references
  const users = db.collection(usersCollection);
  const accounts = db.collection(accountsCollection);

  // Validate recipient username, account number, and amount
  if (!recipientUsername || !recipientAccountNumber || !amount || isNaN(amount) || amount <= 0) {
    return res.json({ success: false, message: 'Invalid transfer details.' });
  }

  // Get account information for the logged-in user
  users.findOne({ username: username })
    .then((senderUser) => {
      if (!senderUser) {
        return res.json({ success: false, message: 'User not found.' });
      }

      if (senderUser.type !== 'user') {
        return res.json({ success: false, message: 'Access denied.' });
      }

      const senderAccountNumber = senderUser.bankAccountNumber;

      // Get recipient account information
      users.findOne({ username: recipientUsername, bankAccountNumber: recipientAccountNumber })
        .then((recipientUser) => {
          if (!recipientUser) {
            return res.json({ success: false, message: 'Recipient not found or account number mismatch.' });
          }

          if (recipientUser.type !== 'user') {
            return res.json({ success: false, message: 'Recipient is not a regular user.' });
          }

          // Get sender's account document
          accounts.findOne({ accountNumber: senderAccountNumber })
            .then((senderAccount) => {
              if (!senderAccount) {
                return res.json({ success: false, message: 'Account not found.' });
              }

              const senderBalance = senderAccount.balance;

              // Check if sender has sufficient balance for the transfer
              if (senderBalance < amount) {
                return res.json({ success: false, message: 'Insufficient balance.' });
              }

              // Deduct the transferred amount from sender's account balance
              const updatedSenderBalance = senderBalance - amount;
              accounts.updateOne(
                { accountNumber: senderAccountNumber },
                { $set: { balance: updatedSenderBalance } }
              )
                .then(() => {
                  // Update recipient's account balance by adding the transferred amount
                  accounts.findOneAndUpdate(
                    { accountNumber: recipientAccountNumber },
                    { $inc: { balance: amount } }
                  )
                    .then(() => {
                      // Update sender's account movements array with the transfer details
                      const senderMovement = {
                        date: new Date().toISOString(),
                        description: `Transfer to ${recipientUsername}`,
                        amount: -amount
                      };

                      accounts.updateOne(
                        { accountNumber: senderAccountNumber },
                        { $push: { accountMovements: senderMovement } }
                      )
                        .then(() => {
                          // Update recipient's account movements array with the deposit details
                          const recipientMovement = {
                            date: new Date().toISOString(),
                            description: `Transfer from ${senderAccountNumber}`,
                            amount: amount
                          };

                          accounts.updateOne(
                            { accountNumber: recipientAccountNumber },
                            { $push: { accountMovements: recipientMovement } }
                          )
                            .then(() => {
                              return res.json({ success: true, message: 'Transfer successful.' });
                            })
                            .catch((error) => {
                              console.error('Error updating recipient account movements:', error);
                              return res.json({ success: false, message: 'Internal server error.' });
                            });
                        })
                        .catch((error) => {
                          console.error('Error updating sender account movements:', error);
                          return res.json({ success: false, message: 'Internal server error.' });
                        });
                    })
                    .catch((error) => {
                      console.error('Error updating recipient balance:', error);
                      return res.json({ success: false, message: 'Internal server error.' });
                    });
                })
                .catch((error) => {
                  console.error('Error updating sender balance:', error);
                  return res.json({ success: false, message: 'Internal server error.' });
                });
            })
            .catch((error) => {
              console.error('Error retrieving sender account:', error);
              return res.json({ success: false, message: 'Internal server error.' });
            });
        })
        .catch((error) => {
          console.error('Error retrieving recipient account:', error);
          return res.json({ success: false, message: 'Internal server error.' });
        });
    })
    .catch((error) => {
      console.error('Error retrieving user:', error);
      return res.json({ success: false, message: 'Internal server error.' });
    });
});

// Handle filtering transactions by date
app.post('/filterTransactions', (req, res) => {
  const { fromDate, toDate, username } = req.body;

  // Set up collection references
  const users = db.collection(usersCollection);
  const accounts = db.collection(accountsCollection);

  // Get account information for the logged-in user
  users.findOne({ username: username })
    .then((user) => {
      if (!user) {
        return res.json({ success: false, message: 'User not found.' });
      }

      const accountNumber = user.bankAccountNumber;

      // Filter transactions by date range
      accounts.findOne({ accountNumber })
        .then((account) => {
          if (!account) {
            return res.json({ success: false, message: 'Account not found.' });
          }

          let filteredTransactions = account.accountMovements.filter((transaction) => {
            const transactionDate = new Date(transaction.date.split('T')[0]);
            
            return new Date(transactionDate) >= new Date(fromDate) && new Date(transactionDate) <= new Date(toDate);
          });

          if (fromDate === "" || toDate === "") {
            filteredTransactions = account.accountMovements;
          } 

          return res.json({ success: true, transactions: filteredTransactions });
        })
        .catch((error) => {
          console.error('Error retrieving account:', error);
          return res.json({ success: false, message: 'Internal server error.' });
        });
    })
    .catch((error) => {
      console.error('Error retrieving user:', error);
      return res.json({ success: false, message: 'Internal server error.' });
    });
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "/login.html"));
});

app.get("/admin", function (req, res) {
  res.sendFile(path.join(__dirname, "/admin.html"));
});

app.get("/:username", function (req, res) {
  res.sendFile(path.join(__dirname, "/user.html"));
});
