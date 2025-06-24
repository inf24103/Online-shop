import express from "express";

const router = express.Router();

// export our router to be mounted by the parent application
export default router

router.use((err, req, res) => {
    console.error("Error in wishlist routing: " + err.message);
    res.status(500).send("Internal Server Error");
});
