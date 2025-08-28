// next-sitemap.config.js
module.exports = {
  siteUrl: 'https://www.exasim.de',
  generateRobotsTxt: true,
  exclude: ['*'], // ← verhindert, dass automatisch Seiten eingesammelt werden
  additionalPaths: async (config) => [
    await config.transform(config, '/'), // ← nur Startseite eintragen
  ],
}