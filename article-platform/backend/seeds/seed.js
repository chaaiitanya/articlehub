require('dotenv').config();
const { connectDB } = require('../src/config/database');
const { hashPassword } = require('../src/middleware/auth');
const slugify = require('slugify');

async function seed() {
  try {
    const db = await connectDB();

    const adminPassword = await hashPassword(process.env.ADMIN_PASSWORD || 'changeme123!');
    await db.query(
      'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING',
      ['admin', adminPassword]
    );

    const sampleArticle = {
      title: 'Welcome to Our Platform',
      content: `# Welcome to Our Platform

This is a sample article to get you started with our content management system.

## Features

- **Markdown Support**: Write articles using Markdown syntax
- **Comment System**: Readers can engage with your content
- **AI Moderation**: Automatic spam and toxicity detection
- **Full-text Search**: Find content quickly

## Getting Started

1. Log in to the admin panel
2. Create new articles
3. Manage comments
4. Monitor engagement

Happy writing!`,
      published: true
    };

    const slug = slugify(sampleArticle.title, { lower: true, strict: true });

    await db.query(
      'INSERT INTO articles (title, slug, content, published) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO NOTHING',
      [sampleArticle.title, slug, sampleArticle.content, sampleArticle.published]
    );

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();