const express = require("express");
const path = require("path");
const cookieParser = require('cookie-parser')
const { connectToMOngoDB } = require("./connect");
const app = express();
const PORT = 5001;
const urlRoute = require("./routes/url");
const {restrictToLoggedinUserOnly, checkAuth} = require("./middleware/auth")
 
const staticRouter = require('./routes/staticRouter')
const URL = require('./models/url');
const userRoute = require('./routes/user');

connectToMOngoDB('mongodb://127.0.0.1:27017/short-url')
.then(() => console.log("Mongodb connected"))


//ui
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.json());
app.use(express.urlencoded({ extended: false}));
app.use(cookieParser());


app.use("/url", restrictToLoggedinUserOnly,urlRoute);
app.use("/user", userRoute);
app.use("/",checkAuth, staticRouter);

app.get('/:shortId', async (req, res) => {
    try {
        const shortId = req.params.shortId;
        const entry = await URL.findOneAndUpdate(
            { shortId },
            {
                $push: {
                    visitHistory: {
                        timestamp: Date.now(),
                    },
                },
            },
            { new: true } // This ensures you get the updated document
        );

        if (!entry) {
            return res.status(404).send("Short URL not found");
        }

        res.redirect(entry.redirectURL);
    } catch (error) {
        console.error("Error finding URL:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.listen(PORT, () => console.log(`server started at ${PORT}`));