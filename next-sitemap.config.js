/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.exasim.de',   // deine Domain, ohne Slash am Ende
  generateRobotsTxt: true,            // robots.txt automatisch erzeugen
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000
}