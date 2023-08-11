// noinspection JSCheckFunctionSignatures

const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const PORT = process.env.PORT || "3000";
const Logger = require("./modules/logger.module");
const NodeCache = require("node-cache");
const ChromegleStatistics = require("./modules/prometheus.module");
const {setChromegleUser} = require("./tools/chromegle.tools");
const {registerPrometheusOmegleMetrics} = require("./modules/general.module");

// Use x-forwarded-for IP for rate limiting
app.enable("trust proxy");
app.use(require("cors")());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.usercache = new NodeCache({stdTTL: 300, checkperiod: 30});
app.gencache = new NodeCache({stdTTL: 300, checkperiod: 30});
app.metrics = new ChromegleStatistics();

/**
 * CORS Settings
 */
app.options("*", (req, res) => {
    res.header('Access-Control-Allow-Origin', "*")
    res.header('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Authorization, Content-Length, X-Requested-With');
    res.send(200);
});

/**
 * Log Requests
 */
app.use((req, res, next) => {

    // Whoever called the API is online
    setChromegleUser(req);

    // Track the request
    app.metrics.insertApiRequest();

    // Log the request
    res.on(
        "finish",
        () => Logger.INFO("%s - \"REQUEST %s\"", res.statusCode, req.headers['x-forwarded-for'] || req.ip, req.originalUrl)
    );

    next();

});


/**
 * Register routes
 */
{
    app.use("/", require("./routes/home.route"));
    app.use("/users", require("./routes/users.route"));
    app.use("/omegle", require("./routes/omegle.route"));
    app.use("/broadcasts", require("./routes/broadcast.route"));
    app.all('*', (_, res) => res.redirect("https://chromegle.net/"));
}

server.listen(PORT, async () => {
    Logger.INFO(`Listening on port ${PORT} for connections!`);

    // Register Prometheus Omegle Metrics
    setInterval(async () => await registerPrometheusOmegleMetrics(app), 60 * 1000);
    await registerPrometheusOmegleMetrics(app);

});
