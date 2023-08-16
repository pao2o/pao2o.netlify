function attachLETFBacktestEventListeners() {
  const inputNames = [
    "start_date",
    "end_date",
    "daily_leverage",
    "add_to_cagr",
    "adjusted_vol_/_actual_vol",
    "add_to_3m_treasury",
    "letf_expense_ratio"
  ];

  const queryDataHandler = () => {
    queryData();
  };

  inputNames.forEach(inputName => {
    const input = document.querySelector(`input[name="${inputName}"]`);
    input.addEventListener("input", queryDataHandler);
  });
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
          console.log("hi")
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

function queryData() {
  const startDateInput = document.querySelector('input[name="start_date"]');
  const endDateInput = document.querySelector('input[name="end_date"]');
  const addCAGRInput = document.querySelector('input[name="add_to_cagr"]');
  const adjustVolInput = document.querySelector('input[name="adjusted_vol_/_actual_vol"]');
  const add3MTreasuryInput = document.querySelector('input[name="add_to_3m_treasury"]');
  const dailyLeverageInput = document.querySelector('input[name="daily_leverage"]');
  const letfExpenseRatioInput = document.querySelector('input[name="letf_expense_ratio"]');

  const startDate = new Date(startDateInput.value + "T00:00:00Z");
  const endDate = new Date(endDateInput.value + "T00:00:00Z");
  const addCAGR = parseFloat(addCAGRInput.value)/100; 
  const adjustVol = parseInt(adjustVolInput.value);
  const add3MTreasury = parseFloat(add3MTreasuryInput.value)/100;
  const dailyLeverage = parseInt(dailyLeverageInput.value);
  const letfExpenseRatio = parseFloat(letfExpenseRatioInput.value)/100;

  //const query = `SELECT Dates, "SPX (with div)", "3M Treasury" FROM Data WHERE Dates BETWEEN '${formatDate(startDate)}' AND '${formatDate(endDate)}'`;

  const query = `
  SELECT Dates, "SPX_with_div", "3M_Treasury"
  FROM (
    SELECT Dates, "SPX_with_div", "3M_Treasury"
    FROM letf_backtest_data
    WHERE Dates = (
      SELECT MAX(Dates)
      FROM letf_backtest_data
      WHERE Dates < '${formatDate(startDate)}'
    )

    UNION ALL

    SELECT Dates, "SPX_with_div", "3M_Treasury"
    FROM letf_backtest_data
    WHERE Dates BETWEEN '${formatDate(startDate)}' AND '${formatDate(endDate)}'
  )
  ORDER BY Dates;
`;

  fetchDataFromDatabase("sql/letf_backtest.db", query)
    .then((result) => {
      // Process the query result
      const dates = result.map((row) => row[0]);
      const spx = result.map((row) => row[1]);
      const treasury3M = result.map((row) => row[2]);

      const periodLength = calculateAndUpdatePeriodLength(startDate, endDate);
      const [dailyReturn, dailyReturnPlus1, returnSquared, returnCubed, returnPower4, returnPower5] = calculateDailyReturn(spx);
      const periodCAGR = calculatePeriodCAGR(periodLength, dailyReturnPlus1)/100;
      const [helper1, helper2, helper3, helper4] = calculateHelperFunction(returnSquared, returnCubed, returnPower4, returnPower5);

      const adjDailyReturnFactor = calculateAdjDailyReturnFactor(periodCAGR, addCAGR, adjustVol, helper1, helper2, helper3, helper4)
      const [adjDailyReturn, adjDailyReturnPlus1] = calculateAdjDailyReturn(dailyReturn, adjustVol, adjDailyReturnFactor);
      const adj3MTreasury = calculateAdj3MTreasury(treasury3M, add3MTreasury)

      const [leveragedDailyReturns, leveragedDailyReturnsPlus1] = calculateLeveragedDailyReturn(adjDailyReturn, adj3MTreasury, dailyLeverage, letfExpenseRatio)
      const [port1X, portLeveraged] = calculatePortValues(adjDailyReturnPlus1, leveragedDailyReturnsPlus1)

      // Update reference cells
      calculatePeriodVolatility(dailyReturn);
      calculateTreasuryAverage(treasury3M);
      calculateAdjustedPeriodCAGR(adjDailyReturnPlus1, periodLength);
      calculateAdjustedPeriodVolatility(adjDailyReturn);
      calculateAdjustedTreasuryAverage(adj3MTreasury);
      calculateLETFCAGR(leveragedDailyReturnsPlus1, periodLength);
      calculateChartData(dates.slice(1), port1X, portLeveraged);
      


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

function calculatePeriodCAGR(periodLength, dailyReturnsPlus1) {
  const periodCAGRInput = document.querySelector('input[name="period_cagr"]');

  const product = dailyReturnsPlus1.reduce((acc, value) => acc * value, 1);
  const cagr = Math.pow(product, 1 / periodLength) - 1;

  const returnValue = (cagr * 100)
  periodCAGRInput.value = returnValue.toFixed(2);
  return returnValue;
}

function calculateHelperFunction(returnSquared, returnCubed, returnPower4, returnPower5) {
  const helper1Input = document.querySelector('input[name="helper1"]');
  const helper2Input = document.querySelector('input[name="helper2"]');
  const helper3Input = document.querySelector('input[name="helper3"]');
  const helper4Input = document.querySelector('input[name="helper4"]');

  const average1 = calculateAverage(returnSquared);
  const average2 = calculateAverage(returnCubed);
  const average3 = calculateAverage(returnPower4);
  const average4 = calculateAverage(returnPower5);

  const helper1 = (252 * average1).toFixed(9);
  const helper2 = (252 * average2).toFixed(9);
  const helper3 = (252 * average3).toFixed(9);
  const helper4 = (252 * average4).toFixed(9);

  helper1Input.value = helper1
  helper2Input.value = helper2
  helper3Input.value = helper3
  helper4Input.value = helper4

  return [helper1, helper2, helper3, helper4]
}

function calculatePeriodVolatility(dailyReturn) {
  const periodVolatilityInput = document.querySelector('input[name="period_volatility"]');

  const stdev = Math.sqrt(252) * standardDeviation(dailyReturn);
  periodVolatilityInput.value = (stdev * 100).toFixed(2);
}

function calculateTreasuryAverage(treasury3M) {
  const treasuryAvgInput = document.querySelector('input[name="3m_treasury_avg"]');

  const sum = treasury3M.reduce((acc, value) => acc + value, 0);
  const average = sum / treasury3M.length ;
  treasuryAvgInput.value = (average * 100).toFixed(2);
}

function calculateAdjustedPeriodCAGR(adjDailyReturnPlus1, periodLength) {
  const periodCAGRInput = document.querySelector('input[name="adjusted_cagr"]');

  const product = adjDailyReturnPlus1.reduce((acc, value) => acc * value, 1);
  const adjusted_cagr = Math.pow(product, 1 / periodLength) - 1;

  periodCAGRInput.value = (adjusted_cagr * 100).toFixed(2);
}


function calculateAdjustedPeriodVolatility(adjDailyReturn) {
  const adjustedVolatilityInput = document.querySelector('input[name="adjusted_volatility"]');

  const stdev = Math.sqrt(252) * standardDeviation(adjDailyReturn)*100;
  adjustedVolatilityInput.value = stdev.toFixed(2);
  calculateLETFVolatility(stdev);
}

function calculateAdjustedTreasuryAverage(adj3MTreasury) {
  const adjustedTreasuryAvgInput = document.querySelector('input[name="adjusted_3m_treasury_avg"]');

  const sum = adj3MTreasury.reduce((acc, value) => acc + value, 0);
  const average = sum / adj3MTreasury.length;
  adjustedTreasuryAvgInput.value = (average * 100).toFixed(2);
}

function calculateLETFCAGR(leveragedDailyReturnsPlus1, periodLength) {
  const letfCAGRInput = document.querySelector('input[name="letf_cagr"]');

  const product = leveragedDailyReturnsPlus1.reduce((acc, value) => acc * value, 1);
  const letf_cagr = Math.pow(product, 1 / periodLength) - 1;

  letfCAGRInput.value = (letf_cagr * 100).toFixed(2);
}


function calculateLETFVolatility(adjustedVolatility) {
  console.log("test");
  const dailyLeverageInput = document.querySelector('input[name="daily_leverage"]');
  const letfVolatilityInput = document.querySelector('input[name="letf_volatility"]');
  try {
    letfVolatilityInput.value = (dailyLeverageInput.value * adjustedVolatility).toFixed(2);
  }
  catch {
    letfVolatilityInput.value = "Error";
  }

}



function calculateChartData(dates, port1X, portLeveraged) {
  const spyFactor = 1000
  const leveragedSpyFactor = 1000

  const returnSpyData = port1X.map((element) => element / spyFactor);
  const returnLeveragedSpyList = portLeveraged.map(
    (element) => element / leveragedSpyFactor
  );

  updateChartData(dates, returnSpyData, returnLeveragedSpyList);
  console.log(dates);
  console.log(returnSpyData);
  console.log(returnLeveragedSpyList);
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
  const dailyReturn = [];
  const dailyReturnPlus1 = [];
  const returnSquared = [];
  const returnCubed = [];
  const returnPower4 = [];
  const returnPower5 = [];

  for (let i = 1; i < arr.length; i++) {
    const tempDailyReturn = (arr[i] / arr[i - 1]) - 1;
    dailyReturn.push(tempDailyReturn);
    dailyReturnPlus1.push(tempDailyReturn + 1);
    returnSquared.push(tempDailyReturn ** 2);
    returnCubed.push(tempDailyReturn ** 3);
    returnPower4.push(tempDailyReturn ** 4);
    returnPower5.push(tempDailyReturn ** 5);    
  }

  return [dailyReturn, dailyReturnPlus1, returnSquared, returnCubed, returnPower4, returnPower5];
}


function calculateAdjDailyReturnFactor(periodCAGR, addCAGR, adjustVol, helper1, helper2, helper3, helper4) {
  const term1 = Math.log(1 + periodCAGR + addCAGR) - adjustVol * Math.log(1 + periodCAGR);
  const term2 = 0.5 * (adjustVol ** 2 - adjustVol) * helper1;
  const term3 = (1 / 3) * (adjustVol - adjustVol ** 3) * helper2;
  const term4 = 0.25 * (adjustVol ** 4 - adjustVol) * helper3;
  const term5 = (1 / 5) * (adjustVol - adjustVol ** 5) * helper4;
  const result = (term1 + term2 + term3 + term4 + term5) / 252;
  return result;
}

function calculateAdjDailyReturn(dailyReturn, adjustVol, adjDailyReturnFactor) {
  const adjDailyReturn = [];
  const adjDailyReturnPlus1 = [];

  for (let i = 0; i < dailyReturn.length; i++) {
    const value = dailyReturn[i];
    const adjustedValue = value * adjustVol + adjDailyReturnFactor;
    adjDailyReturn.push(adjustedValue);
    adjDailyReturnPlus1.push(adjustedValue + 1);
  }

  return [adjDailyReturn, adjDailyReturnPlus1];
}

function calculateAdj3MTreasury(treasury3M, add3MTreasury) {
  return treasury3M.map((value) => value + add3MTreasury);
}

function calculateLeveragedDailyReturn(adjDailyReturn, adj3MTreasury, dailyLeverage, letfExpenseRatio) {
  const leveragedDailyReturns = [];
  const leveragedDailyReturnsPlus1 = [];

  for (let index = 0; index < adjDailyReturn.length; index++) {
    const leveragePart = adjDailyReturn[index] * dailyLeverage;
    const expensePart = (1.05 * (1 - dailyLeverage) * (adj3MTreasury[index + 1] + 0.005)) / 252;
    const leveragedDailyReturn = leveragePart + expensePart - (letfExpenseRatio / 252);

    leveragedDailyReturns.push(leveragedDailyReturn);
    leveragedDailyReturnsPlus1.push(leveragedDailyReturn + 1);
  }

  return [leveragedDailyReturns, leveragedDailyReturnsPlus1];
}

function calculatePortValues(adjDailyReturnPlus1, leveragedDailyReturnsPlus1) {
  const port1X = [adjDailyReturnPlus1[0] * 1000];
  const portLeveraged = [leveragedDailyReturnsPlus1[0] * 1000];
  let previousValueAdj = port1X[0];
  let previousValueLeveraged = portLeveraged[0];

  for (let i = 1; i < adjDailyReturnPlus1.length; i++) {
    const portValueAdj = adjDailyReturnPlus1[i] * previousValueAdj;
    const portValueLeveraged = leveragedDailyReturnsPlus1[i] * previousValueLeveraged;
    port1X.push(portValueAdj);
    portLeveraged.push(portValueLeveraged);

    // Update the previousValue for the next iteration
    previousValueAdj = portValueAdj;
    previousValueLeveraged = portValueLeveraged;
  }

  return [port1X, portLeveraged];
}


