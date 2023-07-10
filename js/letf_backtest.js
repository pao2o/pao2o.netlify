function attachLETFBacktestEventListeners() {
  // Attach event listeners to start date and end date inputs
  const startDateInput = document.querySelector('input[name="start_date"]');
  const endDateInput = document.querySelector('input[name="end_date"]');
  const dailyLeverageInput = document.querySelector('input[name="daily_leverage"]');
  const adjustedVolatilityInput = document.querySelector('input[name="adjusted_volatility"]');
  startDateInput.addEventListener("input", function () {
    calculateAndUpdatePeriodLength();
    calculatePeriodCAGR();
    calculatePeriodVolatility();
    calculateTreasuryAverage();
    calculateAdjustedPeriodCAGR();
    calculateAdjustedPeriodVolatility();
    calculateAdjustedTreasuryAverage();
    calculateLETFCAGR();
    calculateHelperFunction();
    calculateChartData();
  });
  endDateInput.addEventListener("input", function () {
    calculateAndUpdatePeriodLength();
    calculatePeriodCAGR();
    calculatePeriodVolatility();
    calculateTreasuryAverage();
    calculateAdjustedPeriodCAGR();
    calculateAdjustedPeriodVolatility();
    calculateAdjustedTreasuryAverage();
    calculateLETFCAGR();
    calculateHelperFunction();
    calculateChartData();
  });
  dailyLeverageInput.addEventListener("input", calculateLETFVolatility);
  adjustedVolatilityInput.addEventListener("input", calculateLETFVolatility);
}


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
  const startDateInput = document.querySelector('input[name="start_date"]');
  const endDateInput = document.querySelector('input[name="end_date"]');
  const periodLengthInput = document.querySelector(
    'input[name="period_length"]'
  );
  const periodCAGRInput = document.querySelector('input[name="period_cagr"]');

  const startDate = new Date(startDateInput.value + "T00:00:00Z");
  const endDate = new Date(endDateInput.value + "T00:00:00Z");
  const periodLength = parseFloat(periodLengthInput.value);

  const query = `SELECT "1+daily return" FROM Data WHERE Dates BETWEEN '${formatDate(startDate)}' AND '${formatDate(endDate)}'`;

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
  const periodVolatilityInput = document.querySelector('input[name="period_volatility"]');

  const startDate = new Date(startDateInput.value + "T00:00:00Z");
  const endDate = new Date(endDateInput.value + "T00:00:00Z");

  const query = `SELECT "daily return" FROM Data WHERE Dates BETWEEN '${formatDate(startDate)}' AND '${formatDate(endDate)}'`;

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

function calculateTreasuryAverage() {
    const startDateInput = document.querySelector('input[name="start_date"]');
    const endDateInput = document.querySelector('input[name="end_date"]');
    const treasuryAvgInput = document.querySelector('input[name="3m_treasury_avg"]');
  
    const startDate = new Date(startDateInput.value + "T00:00:00Z");
    const endDate = new Date(endDateInput.value + "T00:00:00Z");
  
    const query = `SELECT "3M Treasury" FROM Data WHERE Dates BETWEEN '${formatDate(startDate)}' AND '${formatDate(endDate)}'`;
  
    fetchDataFromDatabase("sql/letf_backtest.db", query)
      .then((result) => {
        // Process the query result
        const values = result.map((row) => row[0]);
        const returns = values.map((value) => parseFloat(value));
        const sum = returns.reduce((acc, value) => acc + value, 0);
        const average = sum / returns.length;
        treasuryAvgInput.value = average.toFixed(2);
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
}

function calculateAdjustedPeriodCAGR() {
    const startDateInput = document.querySelector('input[name="start_date"]');
    const endDateInput = document.querySelector('input[name="end_date"]');
    const periodLengthInput = document.querySelector('input[name="period_length"]');
    const periodCAGRInput = document.querySelector('input[name="adjusted_cagr"]');
  
    const startDate = new Date(startDateInput.value + "T00:00:00Z");
    const endDate = new Date(endDateInput.value + "T00:00:00Z");
    const periodLength = parseFloat(periodLengthInput.value);
  
    const query = `SELECT "1+adj daily return" FROM Data WHERE Dates BETWEEN '${formatDate(startDate)}' AND '${formatDate(endDate)}'`;
  
    fetchDataFromDatabase("sql/letf_backtest.db", query)
      .then((result) => {
        // Process the query result
        const values = result.map((row) => row[0]);
        const returns = values.map((value) => parseFloat(value));
  
        const product = returns.reduce((acc, value) => acc * value, 1);
        const adjusted_cagr = Math.pow(product, 1 / periodLength) - 1;
  
        periodCAGRInput.value = (adjusted_cagr * 100).toFixed(2);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }


  function calculateAdjustedPeriodVolatility() {
    const startDateInput = document.querySelector('input[name="start_date"]');
    const endDateInput = document.querySelector('input[name="end_date"]');
    const adjustedVolatilityInput = document.querySelector('input[name="adjusted_volatility"]');
  
    const startDate = new Date(startDateInput.value + "T00:00:00Z");
    const endDate = new Date(endDateInput.value + "T00:00:00Z");
  
    const query = `SELECT "adj daily return" FROM Data WHERE Dates BETWEEN '${formatDate(startDate)}' AND '${formatDate(endDate)}'`;
  
    fetchDataFromDatabase("sql/letf_backtest.db", query)
      .then((result) => {
        // Process the query result
        const values = result.map((row) => row[0]);
        const returns = values.map((value) => parseFloat(value));
  
        const stdev = Math.sqrt(252) * standardDeviation(returns);
        adjustedVolatilityInput.value = stdev.toFixed(2);
        calculateLETFVolatility(stdev.toFixed(2))
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }
  
  function calculateAdjustedTreasuryAverage() {
    const startDateInput = document.querySelector('input[name="start_date"]');
    const endDateInput = document.querySelector('input[name="end_date"]');
    const adjustedTreasuryAvgInput = document.querySelector('input[name="adjusted_3m_treasury_avg"]');
  
    const startDate = new Date(startDateInput.value + "T00:00:00Z");
    const endDate = new Date(endDateInput.value + "T00:00:00Z");
  
    const query = `SELECT "adj 3M Treasury" FROM Data WHERE Dates BETWEEN '${formatDate(startDate)}' AND '${formatDate(endDate)}'`;
  
    fetchDataFromDatabase("sql/letf_backtest.db", query)
      .then((result) => {
        // Process the query result
        const values = result.map((row) => row[0]);
        const returns = values.map((value) => parseFloat(value));
        const sum = returns.reduce((acc, value) => acc + value, 0);
        const average = sum / returns.length;
        adjustedTreasuryAvgInput.value = average.toFixed(2);
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
}

function calculateLETFCAGR() {
    const startDateInput = document.querySelector('input[name="start_date"]');
    const endDateInput = document.querySelector('input[name="end_date"]');
    const periodLengthInput = document.querySelector('input[name="period_length"]');
    const letfCAGRInput = document.querySelector('input[name="letf_cagr"]');
  
    const startDate = new Date(startDateInput.value + "T00:00:00Z");
    const endDate = new Date(endDateInput.value + "T00:00:00Z");
    const periodLength = parseFloat(periodLengthInput.value);
  
    const query = `SELECT "1+leveraged daily return" FROM Data WHERE Dates BETWEEN '${formatDate(startDate)}' AND '${formatDate(endDate)}'`;
  
    fetchDataFromDatabase("sql/letf_backtest.db", query)
      .then((result) => {
        // Process the query result
        const values = result.map((row) => row[0]);
        const returns = values.map((value) => parseFloat(value));
  
        const product = returns.reduce((acc, value) => acc * value, 1);
        const letf_cagr = Math.pow(product, 1 / periodLength) - 1;
  
        letfCAGRInput.value = (letf_cagr * 100).toFixed(2);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }


function calculateLETFVolatility(adjustedVolatility){
    console.log("test");
    const dailyLeverageInput = document.querySelector('input[name="daily_leverage"]');
    const letfVolatilityInput = document.querySelector('input[name="letf_volatility"]');


    try{
        letfVolatilityInput.value = (dailyLeverageInput.value * adjustedVolatility).toFixed(2);
    }
    catch{
        letfVolatilityInput.value = "Error";
    }

}

function calculateHelperFunction() {
  const startDateInput = document.querySelector('input[name="start_date"]');
  const endDateInput = document.querySelector('input[name="end_date"]');
  const helper1Input = document.querySelector('input[name="helper1"]');
  const helper2Input = document.querySelector('input[name="helper2"]');
  const helper3Input = document.querySelector('input[name="helper3"]');
  const helper4Input = document.querySelector('input[name="helper4"]');

  const startDate = new Date(startDateInput.value + "T00:00:00Z");
  const endDate = new Date(endDateInput.value + "T00:00:00Z");

  const query = `SELECT "return squared", "return cubed", "return power 4", "return power 5" FROM Data WHERE Dates BETWEEN '${formatDate(startDate)}' AND '${formatDate(endDate)}'`;
  const query2 = `
  SELECT "return squared", "return cubed", "return power 4", "return power 5"
  FROM Data
  WHERE Dates <= '${formatDate(startDate)}'
  ORDER BY Dates DESC
  LIMIT 1
`;

  fetchDataFromDatabase("sql/letf_backtest.db", query)
    .then((result) => {
      // Process the query result
      const values1 = result.map((row) => row[0]);
      const values2 = result.map((row) => row[1]);
      const values3 = result.map((row) => row[2]);
      const values4 = result.map((row) => row[3]);

      const average1 = calculateAverage(values1);
      const average2 = calculateAverage(values2);
      const average3 = calculateAverage(values3);
      const average4 = calculateAverage(values4);

      helper1Input.value = (252 * average1).toFixed(9);
      helper2Input.value = (252 * average2).toFixed(9);
      helper3Input.value = (252 * average3).toFixed(9);
      helper4Input.value = (252 * average4).toFixed(9);
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
}

function calculateChartData() {
  const startDateInput = document.querySelector('input[name="start_date"]');
  const endDateInput = document.querySelector('input[name="end_date"]');

  const startDate = new Date(startDateInput.value + "T00:00:00Z");
  const endDate = new Date(endDateInput.value + "T00:00:00Z");

  const query = `SELECT Dates, "1x port", "leveraged port" FROM Data WHERE Dates BETWEEN '${formatDate(startDate)}' AND '${formatDate(endDate)}'`;
  const query2 = `SELECT Dates, "1x port", "leveraged port" FROM Data WHERE Dates <= '${formatDate(startDate)}' ORDER BY Dates DESC LIMIT 1`;
  //test

  fetchDataFromDatabase("sql/letf_backtest.db", query)
    .then((result) => {
      // Process the query result
      const values1 = result.map((row) => row[0]);
      const values2 = result.map((row) => row[1]);
      const values3 = result.map((row) => row[2]);

      const spyData = calculateAverage(values2);
      const leveragedSpyData = calculateAverage(values3);
      return
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
}




/*HELPER FUNCTIONS*/
//format date in 'yyyy-MM-dd' format
function formatDate(date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
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

function calculateAverage(values) {
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}
