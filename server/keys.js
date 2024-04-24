// Keys for the database connection - setup in docker-compose
module.exports = {
    mysqlUser: process.env.MYSQLUSER,
    mysqlHost: process.env.MYSQLHOST,
    mysqlDatabase: process.env.MYSQLDATABASE,
    mysqlPassword: process.env.MYSQLPASSWORD,
    mysqlPort: process.env.MYSQLPORT,
}