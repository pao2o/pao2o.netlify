function attachLETFBacktestEventListeners() {
  // Attach event listeners to start date and end date inputs
  const startDateInput = document.querySelector('input[name="start_date"]');
  const endDateInput = document.querySelector('input[name="end_date"]');
  const dailyLeverageInput = document.querySelector('input[name="daily_leverage"]');
  const adjustedVolatilityInput = document.querySelector('input[name="adjusted_volatility"]');
  startDateInput.addEventListener("input", function () {
    queryData();
    calculateChartData();
  });
  endDateInput.addEventListener("input", function () {
    queryData();
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

function queryData(){
  const startDateInput = document.querySelector('input[name="start_date"]');
  const endDateInput = document.querySelector('input[name="end_date"]');

  const startDate = new Date(startDateInput.value + "T00:00:00Z");
  startDate.setDate(startDate.getDate() - 1);
  const endDate = new Date(endDateInput.value + "T00:00:00Z");

  //const query = `SELECT Dates, "SPX (with div)", "3M Treasury" FROM Data WHERE Dates BETWEEN '${formatDate(startDate)}' AND '${formatDate(endDate)}'`;
  const query = `
  SELECT
    *
  FROM letf_backtest_data
  WHERE Dates BETWEEN '${formatDate(startDate)}' AND '${formatDate(endDate)}'
`;



  fetchDataFromDatabase("sql/letf_backtest.db", query)
    .then((result) => {
      // Process the query result
      const dates = result.map((row) => row[0]);
      const spx = result.map((row) => row[1]);
      const treasury3M = result.map((row) => row[2]);
      const dailyReturn = result.map((row) => row[3]);

      //





      // Update the input cells

      const periodLength = calculateAndUpdatePeriodLength(startDate, endDate);
      calculatePeriodCAGR(startDate, endDate, periodLength);
      calculatePeriodVolatility(startDate, endDate);
      calculateTreasuryAverage(startDate, endDate);
      calculateAdjustedPeriodCAGR(startDate, endDate, periodLength);
      calculateAdjustedPeriodVolatility(startDate, endDate);
      calculateAdjustedTreasuryAverage(startDate, endDate);
      calculateLETFCAGR(startDate, endDate, periodLength);
      calculateHelperFunction(startDate, endDate);


    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
}

function calculateAndUpdatePeriodLength(startDate, endDate) {
  const periodLengthInput = document.querySelector(
    'input[name="period_length"]'
  );

  const millisecondsPerDay = 24 * 60 * 60 * 1000; // Number of milliseconds in a day
  const daysDifference = Math.floor((endDate - startDate) / millisecondsPerDay);
  const monthsDifference = daysDifference / 365.25; // Assuming each month has 30 days
  
  const returnValue = monthsDifference.toFixed(2);
  periodLengthInput.value = returnValue;
  return returnValue;
}

function calculatePeriodCAGR(startDate, endDate, periodLength) {
  const periodCAGRInput = document.querySelector('input[name="period_cagr"]');
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

function calculatePeriodVolatility(startDate, endDate) {
  const periodVolatilityInput = document.querySelector('input[name="period_volatility"]');
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

function calculateTreasuryAverage(startDate, endDate) {
    const treasuryAvgInput = document.querySelector('input[name="3m_treasury_avg"]'); 
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

function calculateAdjustedPeriodCAGR(startDate, endDate, periodLength) {
    const periodCAGRInput = document.querySelector('input[name="adjusted_cagr"]');
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


  function calculateAdjustedPeriodVolatility(startDate, endDate) {
    const adjustedVolatilityInput = document.querySelector('input[name="adjusted_volatility"]');
  
  
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
  
  function calculateAdjustedTreasuryAverage(startDate, endDate) {
    const adjustedTreasuryAvgInput = document.querySelector('input[name="adjusted_3m_treasury_avg"]');
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

function calculateLETFCAGR(startDate, endDate, periodLength) {
    const letfCAGRInput = document.querySelector('input[name="letf_cagr"]');  
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

function calculateHelperFunction(startDate, endDate) {
  const helper1Input = document.querySelector('input[name="helper1"]');
  const helper2Input = document.querySelector('input[name="helper2"]');
  const helper3Input = document.querySelector('input[name="helper3"]');
  const helper4Input = document.querySelector('input[name="helper4"]');

  const query = `SELECT "return squared", "return cubed", "return power 4", "return power 5" FROM Data WHERE Dates BETWEEN '${formatDate(startDate)}' AND '${formatDate(endDate)}'`;

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

  fetchDataFromDatabase("sql/letf_backtest.db", query)
    .then((result) => {
      // Process the query result
      const chartDates = result.map((row) => row[0]);
      const spyData = result.map((row) => row[1]);
      const leveragedSpyData = result.map((row) => row[2]);

      fetchDataFromDatabase("sql/letf_backtest.db", query2)
        .then((result) => {
          // Process the query result
          const spyFactor = result.map((row) => row[1]);
          const leveragedSpyFactor = result.map((row) => row[2]);

          const returnSpyData = spyData.map((element) => element/spyFactor);
          const returnLeveragedSpyList = leveragedSpyData.map((element) => element/leveragedSpyFactor);

          updateChartData(chartDates, returnSpyData, returnLeveragedSpyList);
          console.log(chartDates)
          console.log(returnSpyData);
          console.log(returnLeveragedSpyList);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        });
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
    
}



let chartInstance; // Maintain a reference to the chart instance

function updateChartData(chartDates, spyData, leveragedSpyData) {
  const chartContainer = document.querySelector("#chartContainer");
  const ctx = chartContainer.getContext("2d");

  if (chartInstance) {
    // Update the existing chart with new data
    chartInstance.data.labels = chartDates;
    chartInstance.data.datasets[0].data = spyData;
    chartInstance.data.datasets[1].data = leveragedSpyData;
    chartInstance.update();
  } else {
    // Create a new chart instance if it doesn't exist
    chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: chartDates,
        datasets: [
          {
            label: "SPY",
            data: spyData,
            backgroundColor: "rgba(0, 123, 255, 0.5)",
            borderColor: "rgba(0, 123, 255, 1)",
            borderWidth: 1,
            fill: true,
          },
          {
            label: "Leveraged SPY",
            data: leveragedSpyData,
            backgroundColor: "rgba(204, 102, 0, 0.5)",
            borderColor: "rgba(204, 102, 0, 1)",
            borderWidth: 1,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        normalized: true,
        elements: {
          point: {
            radius: 0 // default to disabled in all datasets
          }
        },
        scales: {
          y: {
            type: 'logarithmic', // Set y-axis scale to logarithmic
            beginAtZero: false, // Include zero as a tick
            ticks: {
              callback: function (value, index, values) {
                return Number(value.toString()); // Return the logarithmic value as a number
              }
            }
          },
        },
        plugins: {
          zoom: {
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true,
              },
              mode: "x",
            },
            pan: {
              enabled: true,
              mode: "x",
            },
          },
        },
        
      },
    });
  }
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

function calculateDailyReturn(arr) {
  const result = [];
  for (let i = 1; i < arr.length; i++) {
    result.push((arr[i] / arr[i - 1]) - 1);
  }
  return result;
}

function calculateAdjustedDailyReturn(){
  // Input cell references
  var F4 = Main.F4;
  var B8 = Main.B8;
  var C8 = Main.C8;
  var J4 = Main.J4;
  var J5 = Main.J5;
  var J6 = Main.J6;
  var J7 = Main.J7;

  // Intermediate calculations
  var term1 = Math.log(1 + F4 + B8);
  var term2 = C8 * Math.log(1 + F4);
  var term3 = 0.5 * (C8 ** 2 - C8) * J4;
  var term4 = (1 / 3) * (C8 - C8 ** 3) * J5;
  var term5 = 0.25 * (C8 ** 4 - C8) * J6;
  var term6 = (1 / 5) * (C8 - C8 ** 5) * J7;

  // Final result
  var result = (term1 - term2 + term3 + term4 + term5 + term6) / 252;

  return result;
}
