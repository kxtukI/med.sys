import 'dotenv/config'

export default {
    secret: process.env.JWT_TOKEN,
    expiresIn: "7d"
}