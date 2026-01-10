import { seedAssets } from './src/backend/src/common/database/seeds/assets.seed';

async function main() {
  try {
    console.log('Loading assets seeds...');
    await seedAssets();
    console.log('✅ Assets seeds loaded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error loading assets seeds:', error);
    process.exit(1);
  }
}

main();
