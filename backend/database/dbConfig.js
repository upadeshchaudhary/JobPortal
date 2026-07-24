const { Sequelize } = require('sequelize');

const Database_URL = process.env.DATABASE_URL || "postgresql://postgres:upaDesh@123@db.gjyaivqpapqbohajwpjy.supabase.co:5432/postgres";

const sequelize = new Sequelize(Database_URL, {
    dialect: "postgres",
    protocol: "postgres",
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
})

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log("Database connected successfully.");
        // Load relatinships
        require("../model/index")
    } catch (error) {
        console.error("Unable to connect to the database:", error);
    }

    await sequelize.sync({ force: false, alter:false}).then(() => {
        console.log("All models were synchronized successfully.")
    })
}

module.exports = { sequelize, connectDB };