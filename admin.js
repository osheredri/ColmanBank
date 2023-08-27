document.addEventListener('DOMContentLoaded', () => {
  const addUserForm = document.getElementById('addUserForm');
  const accountList = document.getElementById('accountList');
  const accountModal = document.getElementById('accountModal');
  const accountDetails = document.getElementById('accountDetails');
  const closeBtn = document.getElementsByClassName('close')[0];

  // Event listener for the add user form submission
  addUserForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.toLowerCase();
    const password = document.getElementById('password').value;
    const userType = document.getElementById('userType').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const address = document.getElementById('address').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const email = document.getElementById('email').value;

    // Send the user data to the server for adding
    fetch('/addUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, 
        password, 
        userType, 
        firstName, 
        lastName,
        address,
        phoneNumber,
        email
       })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('User added successfully!');
        // Clear the form inputs
        addUserForm.reset();
        loadAccountList()
      } else {
        alert('Error adding user. Please try again.');
      }
    })
    .catch(error => {
      console.error('Error adding user:', error);
      alert('An error occurred. Please try again later.');
    });
  });

  // Function to open the account details modal
  const openModal = (account) => {
    const name = document.getElementById('name');
    const username = document.getElementById('usernameModal');
    const address = document.getElementById('addressModal');
    const phone = document.getElementById('phoneModal');
    const email = document.getElementById('emailModal');
    const balance = document.getElementById('balanceModal');

    name.textContent = `${account.firstName} ${account.lastName}`;
    username.textContent = account.username;
    address.textContent = account.address;
    phone.textContent = account.phoneNumber;
    email.textContent = account.email;
    balance.textContent = account.balance;

    accountModal.style.display = 'block';
  };

  // Function to display the list of accounts
  function displayAccountList(accounts) {
    accountList.innerHTML = '';

    accounts.forEach(account => {
      const li = document.createElement('li');
      li.textContent = `Account Number: ${account.accountNumber} --- Username: ${account.username}`;
      li.addEventListener('click', () => {
        openModal(account);
      });
      
      const removeButton = document.createElement('button');
      removeButton.textContent = 'Remove Account';
      removeButton.addEventListener('click', () => {
        // Remove the user by sending a request to the server
        fetch('/removeUser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ accountNumber: account.accountNumber })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            alert('User removed successfully!');
            // Refresh the account list
            loadAccountList();
          } else {
            alert('Error removing user. Please try again.');
          }
        })
        .catch(error => {
          console.error('Error removing user:', error);
          alert('An error occurred. Please try again later.');
        });
      });

      li.appendChild(removeButton);
      accountList.appendChild(li);
    });
  }

  // Function to load the account list from the server
  function loadAccountList() {
    fetch('/accounts')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          displayAccountList(data.accounts);
        } else {
          alert('Error retrieving account list. Please try again.');
        }
      })
      .catch(error => {
        console.error('Error retrieving account list:', error);
        alert('An error occurred. Please try again later.');
      });
  }

  // Function to close the account details modal
  const closeModal = () => {
    accountModal.style.display = 'none';
  };

  // Attach event listener to close button
  closeBtn.addEventListener('click', closeModal);

  // Load the account list when the page loads
  loadAccountList();

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
