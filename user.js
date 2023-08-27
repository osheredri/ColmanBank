document.addEventListener('DOMContentLoaded', function () {
  // Get DOM elements
  const balanceElement = document.getElementById('balance');
  const fromDateElement = document.getElementById('fromDate');
  const toDateElement = document.getElementById('toDate');
  const filterBtn = document.getElementById('filterBtn');
  const clearBtn = document.getElementById('clearBtn');
  const transactionsTable = document.getElementById('transactionsTable');
  const transactionsList = document.getElementById('transactionsList');
  const recipientElement = document.getElementById('recipient');
  const accountNumberElement = document.getElementById('accountNumber');
  const amountElement = document.getElementById('amount');
  const transferBtn = document.getElementById('transferBtn');
  const welcomeUser = document.getElementById('welcomeUser');

  const url = window.location.href.split(":");
  const username = url[url.length - 1]

  // Function to display user name 
  const displayUserName = (username) => {
    welcomeUser.innerText = `Welcome to the Colman Bank, ${username}.`;
  };

  // Function to display account balance
  const displayUserDeatails = (data) => {
    const name = document.getElementById('name');
    const address = document.getElementById('address');
    const phone = document.getElementById('phone');
    const email = document.getElementById('email');

    name.textContent = `${data.firstName} ${data.lastName}`;
    address.textContent = data.address;
    phone.textContent = data.phoneNumber;
    email.textContent = data.email;
    balanceElement.textContent = data.balance;
  };

  // Function to display transactions
  const displayTransactions = (transactions) => {
    transactionsList.innerHTML = '';

    transactions.forEach((transaction) => {
      const row = document.createElement('tr');

      const dateCell = document.createElement('td');
      dateCell.textContent = transaction.date.split('T')[0];
      row.appendChild(dateCell);

      const descriptionCell = document.createElement('td');
      descriptionCell.textContent = transaction.description;
      row.appendChild(descriptionCell);

      const amountCell = document.createElement('td');
      amountCell.textContent = transaction.amount;
      row.appendChild(amountCell);

      transactionsList.appendChild(row);
    });
  };

  // Retrieve account information and transactions on page load
  const retrieveAccountDetails = () => {
    fetch(`/user/:${username}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        displayUserName(data.account.username);
        displayUserDeatails(data.account);
        displayTransactions(data.account.accountMovements);
      } else {
        alert('Error retrieving account information: ' + data.message);
      }
    })
    .catch((error) => {
      console.error('Error retrieving account information:', error);
      alert('Error retrieving account information. Please try again later.');
    });
  }

  // Function to filter transactions by date
  const filterTransactions = () => {
    const fromDate = fromDateElement.value;
    const toDate = toDateElement.value;

    // Make AJAX request to the server to filter transactions
    fetch('/filterTransactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fromDate, toDate, username })
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          displayTransactions(data.transactions);
        } else {
          alert('Error filtering transactions: ' + data.message);
        }
      })
      .catch((error) => {
        console.error('Error filtering transactions:', error);
        alert('Error filtering transactions. Please try again later.');
      });
  };

  const clearFilterTransactions = () => {
    fromDateElement.value = '';
    toDateElement.value = '';
    filterTransactions();
  }

  const resetBankTransferInputs = () => {
    recipientElement.value = "";
    accountNumberElement.value = "";
    amountElement.value = "";
  }

  // Function to make a bank transfer
  const makeTransfer = () => {
    const recipientUsername = recipientElement.value;
    const recipientAccountNumber = accountNumberElement.value;
    const amount = parseFloat(amountElement.value);

    // Make AJAX request to the server to perform the transfer
    fetch('/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, recipientUsername, recipientAccountNumber, amount })
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          alert(data.message);
          resetBankTransferInputs();
          retrieveAccountDetails();
        } else {
          alert('Error making transfer: ' + data.message);
        }
      })
      .catch((error) => {
        console.error('Error making transfer:', error);
        alert('Error making transfer. Please try again later.');
      });
  };

  retrieveAccountDetails();

  // Attach event listeners
  filterBtn.addEventListener('click', filterTransactions);
  clearBtn.addEventListener('click', clearFilterTransactions);
  transferBtn.addEventListener('click', makeTransfer);

  // Logout functionality
  const logoutButton = document.getElementById('logoutButton');
  logoutButton.addEventListener('click', () => {
    fetch('/logout')
      .then(() => {
        window.location.href = '/';
      })
      .catch((error) => {
        console.error('Error logging out:', error);
        alert('Error logging out. Please try again later.');
      });
  });
});
