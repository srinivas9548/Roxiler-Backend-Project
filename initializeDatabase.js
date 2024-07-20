const sqlite3 = require("sqlite3");
const axios = require("axios");

const db = new sqlite3.Database('database.db');

const url = "https://s3.amazonaws.com/roxiler.com/product_transaction.json";

axios.get(url)
    .then((response) => {
        const jsonData = response.data
        // console.log(jsonData);

        const insertDataToDatabase = db.prepare(
            'INSERT INTO products (id, title, price, description, category, image, sold, dateOfSale) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );

        db.serialize(() => {
            jsonData.forEach((product) => {
                insertDataToDatabase.run(
                    product.id,
                    product.title,
                    product.price,
                    product.description,
                    product.category,
                    product.image,
                    product.sold,
                    product.dateOfSale
                );
            });

            insertDataToDatabase.finalize();

            console.log("Database initialized with seed data.")
        });

        db.close();
    })
    .catch((error) => {
        console.log('Error fetching data from the URL: ', error.message);
    });
