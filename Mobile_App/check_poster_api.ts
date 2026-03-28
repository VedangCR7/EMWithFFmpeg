import request from 'supertest';
import express from 'express';
import postersRouter from '../src/routes/mobile/posters';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/mobile/posters', postersRouter);

async function checkApi(category: string) {
  console.log(`\n\n🔍 Checking API for category: "${category}"`);
  console.log('--------------------------------------------------');
  
  try {
    const response = await request(app)
      .get(`/api/mobile/posters/category/${encodeURIComponent(category)}`)
      .expect(200);

    const data = response.body;
    
    if (data.success) {
      if (data.data.parentCategory) {
        console.log('✅ TYPE: HIERARCHICAL');
        console.log(`📂 Parent: ${data.data.parentCategory}`);
        console.log(`📊 Subcategories found: ${data.data.categories.length}`);
        data.data.categories.forEach((cat: any) => {
          console.log(`   - ${cat.name}: ${cat.images.length} images`);
        });
      } else {
        console.log('✅ TYPE: FLAT (Backward Compatible)');
        console.log(`🖼️  Posters count: ${data.data.posters?.length || 0}`);
      }
    } else {
      console.log('❌ API returned error:', data.error);
    }
  } catch (error) {
    console.error('❌ Request failed:', (error as Error).message);
  }
}

async function run() {
  await checkApi('Events');
  process.exit(0);
}

run();
