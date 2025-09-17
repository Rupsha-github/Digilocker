import express from 'express';

const router = express.Router();

router.get("/", (req, res) => {
    res.render('home');
})

router.get("/signup", (req, res) => {
    res.render('signup', {
        emailError: null,
        formData: {}
    });
})

router.get("/login", (req, res) => {
    res.render('login');
})

export default router;