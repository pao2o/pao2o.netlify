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
  const periodLengthInput = document.querySelector(
    'input[name="period_length"]'
  );

  const startDate = new Date(startDateInput.value + "T00:00:00Z");
  const endDate = new Date(endDateInput.value + "T00:00:00Z");

  const millisecondsPerDay = 24 * 60 * 60 * 1000; // Number of milliseconds in a day
  const daysDifference = Math.floor((endDate - startDate) / millisecondsPerDay);
  const monthsDifference = daysDifference / 365.25; // Assuming each month has 30 days

  periodLengthInput.value = monthsDifference.toFixed(2);
}

function calculatePeriodCAGR() {
  console.log("test");
  const startDateInput = document.querySelector('input[name="start_date"]');
  const endDateInput = document.querySelector('input[name="end_date"]');
  const periodLengthInput = document.querySelector(
    'input[name="period_length"]'
  );
  const periodCAGRInput = document.querySelector('input[name="period_cagr"]');

  const startDate = new Date(startDateInput.value + "T00:00:00Z");
  const endDate = new Date(endDateInput.value + "T00:00:00Z");
  const periodLength = parseFloat(periodLengthInput.value);

  const query = `SELECT "1+daily return" FROM Data WHERE Dates BETWEEN '${formatDate(
    startDate
  )}' AND '${formatDate(endDate)}'`;

  fetchDataFromDatabase("sql/letf_backtest.db", query)
    .then((result) => {
      // Process the query result
      const values = result.map((row) => row[0]);
      const returns = values.map((value) => parseFloat(value));

      const product = returns.reduce((acc, value) => acc * value, 1);
      const cagr = Math.pow(product, 1 / periodLength) - 1;

      periodCAGRInput.value = (cagr * 100).toFixed(2);
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
}

function calculatePeriodVolatility() {
  const startDateInput = document.querySelector('input[name="start_date"]');
  const endDateInput = document.querySelector('input[name="end_date"]');
  const periodVolatilityInput = document.querySelector(
    'input[name="period_volatility"]'
  );

  const startDate = new Date(startDateInput.value + "T00:00:00Z");
  const endDate = new Date(endDateInput.value + "T00:00:00Z");

  const query = `SELECT "daily return" FROM Data WHERE Dates BETWEEN '${formatDate(
    startDate
  )}' AND '${formatDate(endDate)}'`;

  fetchDataFromDatabase("sql/letf_backtest.db", query)
    .then((result) => {
      // Process the query result
      const values = result.map((row) => row[0]);
      const returns = values.map((value) => parseFloat(value));

      const stdev = Math.sqrt(252) * standardDeviation(returns);
      periodVolatilityInput.value = stdev.toFixed(2);
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
}

/*HELPER FUNCTIONS*/
//format date in 'yyyy-MM-dd' format
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function standardDeviation(values) {
  const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
  const squaredDifferences = values.map((value) => (value - mean) ** 2);
  const variance =
    squaredDifferences.reduce((acc, value) => acc + value, 0) / values.length;
  const stdev = Math.sqrt(variance);

  return stdev;
}
