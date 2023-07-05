function fetchDataFromDatabase(databasePath, query) {
  return new Promise((resolve, reject) => {
    // Initialize SQL.js using the initSqlJs function
    initSqlJs({ locateFile: (file) => `sql/${file}` }).then((SQL) => {
      // Fetch the database file
      fetch(databasePath)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => {
          const data = new Uint8Array(arrayBuffer);
          // Open the database
          const db = new SQL.Database(data);

          // Execute the query
          const result = db.exec(query);
          const rows = result[0].values;

          // Close the database
          db.close();

          // Resolve with the query result
          resolve(rows);
        })
        .catch((error) => {
          // Reject with the error
          reject(error);
        });
    });
  });
}

function calculateAndUpdatePeriodLength() {
    const startDateInput = document.querySelector('input[name="start_date"]');
    const endDateInput = document.querySelector('input[name="end_date"]');
    const periodLengthInput = document.querySelector('input[name="period_length"]');
  
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
  
    const millisecondsPerDay = 24 * 60 * 60 * 1000; // Number of milliseconds in a day
    const daysDifference = Math.floor((endDate - startDate) / millisecondsPerDay);
    const monthsDifference = daysDifference / 365.25; // Assuming each month has 30 days
  
    periodLengthInput.value = monthsDifference;
  }
  

  function calculatePeriodCAGR() {
    console.log("test");
    const startDateInput = document.querySelector('input[name="start_date"]');
    const endDateInput = document.querySelector('input[name="end_date"]');
    const periodLengthInput = document.querySelector('input[name="period_length"]');
  
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    const periodLength = parseFloat(periodLengthInput.value);
  
    const query = `SELECT Dates, "1+daily return" FROM Data WHERE substr(Dates, 7, 4) || '-' || substr(Dates, 1, 2) || '-' || substr(Dates, 4, 2) BETWEEN '${formatDate(startDate)}' AND '${formatDate(endDate)}'`;

    fetchDataFromDatabase("sql/letf_backtest.db", query)
      .then((result) => {
        // Process the query result
        const values = result.map((row) => row[0]);
        const values2 = result.map((row) => row[1]);
        const returns = values.map((value) => parseFloat(value));
    
        const product = returns.reduce((acc, value) => acc * value, 1);
        const cagr = Math.pow(product, 1 / periodLength) - 1;
    
        console.log("CAGR:", cagr);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }
  
  
  // Helper function to format date in 'yyyy-MM-dd' format
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  




/*
fetchDataFromDatabase("sql/letf_backtest.db", "SELECT * FROM Data")
  .then((result) => {
    // Process the query result
    result.forEach((row) => {
      // Access row data, e.g., row[0], row[1], etc.
      console.log(row);
    });
  })
  .catch((error) => {
    console.error("Error fetching database:", error);
  });
fetchDataFromDatabase("sql/letf_backtest.db", "SELECT * FROM selectData")
  .then((result) => {
    // Process the query result
    result.forEach((row) => {
      // Access row data, e.g., row[0], row[1], etc.
      console.log(row);
    });
  })
  .catch((error) => {
    console.error("Error fetching database:", error);
  });
*/