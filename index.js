const express = require("express");
const path = require("path");
const cors = require("cors");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, "database.db");

let db = null;

const initializeDBAndServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        })

        app.listen(3000, () => {
            console.log("Server is Running at http://localhost:3000/");
        })
    } catch (e) {
        console.log(`DB Error: ${e.message}`);
        process.exit(1);
    }
}

initializeDBAndServer();

// Create an API to list the all transactions
//  - API should support search and pagination on product transactions
//  - Based on the value of search parameters, it should match search text on product
//    title/description/price and based on matching result it should return the product
//    transactions
//  - If search parameter is empty then based on applied pagination it should return all the
//    records of that page number
//  - Default pagination values will be like page = 1, per page = 10

app.get('/', async (request, response) => {
    try {
        response.send('Welcome! This is Roxiler Company Assignment backend domin. Please access any path to get the data.')
    } catch (error) {
        console.log(error.message);
        response.status(500).json({ error: 'Intenal Server Error' });
    }
});

// API to list all transactions with search and pagination

// http://localhost:3000/transactions?page=1$perPage=10&search=''

app.get('/transactions', async (request, response) => {
    try {
        const page = parseInt(request.query.page) || 1;
        const perPage = parseInt(request.query.perPage) || 10;
        const search = request.query.search ? request.query.search.toLowerCase() : '';
        const selectedMonth = request?.query?.month?.toLowerCase() || 'march';

        console.log(page, perPage);

        const months = {
            'january': '01',
            'february': '02',
            'march': '03',
            'april': '04',
            'may': '05',
            'june': '06',
            'july': '07',
            'august': '08',
            'september': '09',
            'october': '10',
            'november': '11',
            'december': '12'
        };

        const numericMonth = months[selectedMonth.toLowerCase()];

        //write sql query with search and pagination
        const getSqlQuery = `
            SELECT 
              * 
            FROM 
              products
            WHERE
              strftime('%m', dateOfSale) = ? 
              AND (
                lower(title) LIKE '%${search}%'
                OR lower(description) LIKE '%${search}%'
                OR CAST(price AS TEXT) LIKE '%${search}%'
              )
            LIMIT ${perPage} OFFSET ${(page - 1) * perPage};
        `;

        const rows = await db.all(getSqlQuery, [numericMonth]);
        response.json({ page, perPage, transactions: rows })
        // console.log(rows);

    } catch (error) {
        console.log(error.message);
        response.status(500).json({ error: 'Intenal Server Error' });
    }
})

// Create an API for statistics
//  - Total sale amount of selected month
//  - Total number of sold items of selected month
//  - Total number of not sold items of selected month

// http://localhost:3000/statistics?month=january

app.get('/statistics', async (request, response) => {
    try {
        // console.log('Request received from /statistics');
        const selectedMonth = request.query.month || 'march';
        // console.log('Selected Month:', selectedMonth);

        if (!selectedMonth) {
            return response.status(400).json({ error: 'Month parameter is required.' });
        }

        const months = {
            'january': '01',
            'february': '02',
            'march': '03',
            'april': '04',
            'may': '05',
            'june': '06',
            'july': '07',
            'august': '08',
            'september': '09',
            'october': '10',
            'november': '11',
            'december': '12'
        };

        const numericMonth = months[selectedMonth.toLowerCase()];

        if (!numericMonth) {
            return response.status(400).json({ error: 'Invalid month name.' });
        }

        // SQL query to get statistics for the given month
        const getSqlQuery = `
            SELECT
              SUM(CASE WHEN sold = 1 THEN price ELSE 0 END) as totalSaleAmount,
              COUNT(CASE WHEN sold = 1 THEN 1 END) as totalSoldItems,
              COUNT(CASE WHEN sold = 0 THEN 1 END) as totalNotSoldItems
            FROM
              products
            WHERE
              strftime('%m', dateOfSale) = ?;
        `;

        const statistics = await db.get(getSqlQuery, [numericMonth]);

        if (!statistics) {
            return response.status(400).json({ error: 'No data found for the selected month.' });
        }

        response.json({
            selectedMonth,
            totalSaleAmount: Math.floor(statistics.totalSaleAmount) || 0,
            totalSoldItems: statistics.totalSoldItems || 0,
            totalNotSoldItems: statistics.totalNotSoldItems || 0
        });
    } catch (error) {
        console.log(error.message);
        response.status(500).json({ error: 'Intenal Server Error' });
    }
});

// Create an API for bar chart ( the response should contain price range and the number
//     of items in that range for the selected month regardless of the year )
//     - 0 - 100
//     - 101 - 200
//     - 201-300
//     - 301-400
//     - 401-500
//     - 501 - 600
//     - 601-700
//     - 701-800
//     - 801-900
//     - 901-above

// http://localhost:3000/bar-chart?month=january

app.get('/bar-chart', async (request, response) => {
    try {
        const selectedMonth = request.query.month || 'march';

        if (!selectedMonth) {
            return response.status(400).json({ error: 'Month parameter is required.' });
        }

        const months = {
            'january': '01',
            'february': '02',
            'march': '03',
            'april': '04',
            'may': '05',
            'june': '06',
            'july': '07',
            'august': '08',
            'september': '09',
            'october': '10',
            'november': '11',
            'december': '12'
        };

        const numericMonth = months[selectedMonth.toLowerCase()];

        // SQL query to get bar chart data for a selected month
        const getSqlQuery = `
            SELECT
              priceRanges.priceRange,
              COUNT(products.price) as itemCount
            FROM (
                SELECT '0 - 100' as priceRange, 0 as MIN_RANGE, 100 as MAX_RANGE
                UNION SELECT '101 - 200', 101, 200
                UNION SELECT '201 - 300', 201, 300
                UNION SELECT '301 - 400', 301, 400
                UNION SELECT '401 - 500', 401, 500
                UNION SELECT '501 - 600', 501, 600
                UNION SELECT '601 - 700', 601, 700
                UNION SELECT '701 - 800', 701, 800
                UNION SELECT '801 - 900', 801, 900
                UNION SELECT '901 - above', 901, 9999999
            ) as priceRanges
             LEFT JOIN products ON strftime('%m', dateOfSale) = ? AND price BETWEEN MIN_RANGE AND MAX_RANGE
             GROUP BY 
                priceRanges.priceRange;
        `;

        const barChartData = await db.all(getSqlQuery, [numericMonth]);
        response.json(barChartData);
    } catch (error) {
        console.log(error.message);
        response.status(500).json({ error: 'Intenal Server Error' });
    }
});

// Create an API for pie chart Find unique categories and number of items from that
// category for the selected month regardless of the year.
// For example :
//  - X category : 20 (items)
//  - Y category : 5 (items)
//  - Z category : 3 (items)

// http://localhost:3000/pie-chart?month=january
app.get('/pie-chart', async (request, response) => {
    try {
        const selectedMonth = request.query.month || 'march';

        if (!selectedMonth) {
            return response.status(400).json({ error: 'Month parameter is required.' });
        }

        const months = {
            'january': '01',
            'february': '02',
            'march': '03',
            'april': '04',
            'may': '05',
            'june': '06',
            'july': '07',
            'august': '08',
            'september': '09',
            'october': '10',
            'november': '11',
            'december': '12'
        };

        const numericMonth = months[selectedMonth.toLowerCase()];

        // SQL query to get the pie chart data for the selected month
        const getSqlQuery = `
            SELECT DISTINCT
              category,
              COUNT(*) as itemCount
            FROM
              products
            WHERE
              strftime('%m', dateOfSale) = ?
            GROUP BY
                category;
        `;

        const pieChartData = await db.all(getSqlQuery, [numericMonth]);
        response.json(pieChartData);
    } catch (error) {
        console.log(error.message);
        response.status(500).json({ error: 'Intenal Server Error' });
    }
});

// Create an API which fetches the data from all the 3 APIs mentioned above, combines
// the response and sends a final response of the combined JSON

app.get('/combined-response', async (request, response) => {
    try {
        const selectedMonth = request.query.month || 'march';
        const { search, page, perPage } = request.query;

        if (!selectedMonth) {
            return response.status(400).json({ error: 'Month parameter is required.' });
        }

        const months = {
            'january': '01',
            'february': '02',
            'march': '03',
            'april': '04',
            'may': '05',
            'june': '06',
            'july': '07',
            'august': '08',
            'september': '09',
            'october': '10',
            'november': '11',
            'december': '12'
        };

        const numericMonth = months[selectedMonth.toLowerCase()];

        // Fetch Data from the four API's
        const transactionsData = await fetchTransactions(numericMonth, search, page || 1, perPage || 10);
        const statisticsData = await fetchStatistics(numericMonth);
        const barChartData = await fetchBarChart(numericMonth);
        const pieChartData = await fetchPieChart(numericMonth);

        // Combine the responses into a single  JSON Object.
        const combinedResponse = {
            transactions: transactionsData,
            statistics: statisticsData,
            barChart: barChartData,
            pieChart: pieChartData
        };

        response.json(combinedResponse);
    } catch (error) {
        console.log(error.message);
        response.status(500).json({ error: 'Intenal Server Error' });
    }
});

// Function to fetch transactions data with search, pagination and month filter
async function fetchTransactions(numericMonth, search, page, perPage) {
    // SQL query with search, month filter, pagination
    const getSqlQuery = `
        SELECT 
          *
        FROM
          products
        WHERE
          strftime('%m', dateOfSale) = ?
          AND (
            lower(title) LIKE '%${search}%'
            OR lower(description) LIKE '%${search}%'
            OR CAST(price AS TEXT) LIKE '%${search}%'
          )
        LIMIT ${perPage} OFFSET ${(page - 1) * perPage};
    `;

    const transactionsData = await db.all(getSqlQuery, [numericMonth]);
    return transactionsData;
};

// Function to fetch statistics data
async function fetchStatistics(numericMonth) {
    const getSqlQuery = `
        SELECT
            CAST(SUM(CASE WHEN sold = 1 THEN price ELSE 0 END) as INT) as totalSaleAmount,
            COUNT(CASE WHEN sold = 1 THEN 1 END) as totalSoldItems,
            COUNT(CASE WHEN sold = 0 THEN 1 END) as totalNotSoldItems
        FROM
            products
        WHERE
            strftime('%m', dateOfSale) = ?;
    `;

    const statisticsData = await db.get(getSqlQuery, [numericMonth]);
    return statisticsData;
};

// Function to fetch bar chart data
async function fetchBarChart(numericMonth) {
    const getSqlQuery = `
        SELECT
          CASE
            WHEN price BETWEEN 0 AND 100 THEN '0 - 100'
            WHEN price BETWEEN 101 AND 200 THEN '101 - 200'
            WHEN price BETWEEN 201 AND 300 THEN '201 - 300'
            WHEN price BETWEEN 301 AND 400 THEN '301 - 400'
            WHEN price BETWEEN 401 AND 500 THEN '401 - 500'
            WHEN price BETWEEN 501 AND 600 THEN '501 - 600'
            WHEN price BETWEEN 601 AND 700 THEN '601 - 700'
            WHEN price BETWEEN 701 AND 800 THEN '701 - 800'
            WHEN price BETWEEN 801 AND 900 THEN '801 - 900'
            WHEN price >= 901 THEN '901-above'
          END as priceRange,
          COUNT(*) as itemCount
        FROM 
          products
        WHERE
          strftime('%m', dateOfSale) = ?
        GROUP BY
          priceRange;
    `;

    const barChartData = await db.all(getSqlQuery, [numericMonth]);
    return barChartData;
};

// Function to fetch pie chart data
async function fetchPieChart(numericMonth) {
    const getSqlQuery = `
        SELECT DISTINCT
          category,
          COUNT(*) as itemCount
        FROM
          products
        WHERE
          strftime('%m', dateOfSale) = ?
        GROUP BY
          category;
    `;

    const pieChartData = await db.all(getSqlQuery, [numericMonth]);
    return pieChartData;
};

module.exports = app;