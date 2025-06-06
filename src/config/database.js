import 'dotenv/config';

export default {
  dialect: 'postgres',
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  define: {
    timestamps: false,
    underscored: true,
    underscoredAll: true,
  },
  dialectOptions: {
    timezone: '-03:00',
  },
  timezone: '-03:00',
};
