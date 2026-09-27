/**
 * ExamSphere AI — Role Migration Script
 * 
 * PURPOSE: One-time migration from the old 2-tier admin hierarchy
 * (overall_admin → institution_admin) to the new single-institution
 * 4-role model (college_admin, teacher, invigilator, student).
 * 
 * WHAT IT DOES:
 *   - Renames 'overall_admin' users → 'college_admin'
 *   - Renames 'institution_admin' users → 'college_admin'
 *   - Adds isActive: true to all existing users that don't have it
 * 
 * USAGE:
 *   cd examsphere-ai/server
 *   node scripts/migrate-roles.js
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/examsphere-ai';

async function migrate() {
  console.log('🔄 ExamSphere AI — Role Migration Starting...');
  console.log(`📡 Connecting to: ${MONGODB_URI}`);

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Database connected\n');

  const db = mongoose.connection.db;
  const users = db.collection('users');

  // 1. Rename 'overall_admin' → 'college_admin'
  const overallResult = await users.updateMany(
    { role: 'overall_admin' },
    { $set: { role: 'college_admin', isActive: true } }
  );
  console.log(`✅ Renamed ${overallResult.modifiedCount} overall_admin → college_admin`);

  // 2. Rename 'institution_admin' → 'college_admin'
  const instResult = await users.updateMany(
    { role: 'institution_admin' },
    { $set: { role: 'college_admin', isActive: true } }
  );
  console.log(`✅ Renamed ${instResult.modifiedCount} institution_admin → college_admin`);

  // 3. Add isActive: true to all users that don't have it
  const activeResult = await users.updateMany(
    { isActive: { $exists: false } },
    { $set: { isActive: true } }
  );
  console.log(`✅ Added isActive:true to ${activeResult.modifiedCount} existing users`);

  // 4. Add batch: '' to all student users that don't have it
  const batchResult = await users.updateMany(
    { role: 'student', batch: { $exists: false } },
    { $set: { batch: '' } }
  );
  console.log(`✅ Added batch field to ${batchResult.modifiedCount} students`);

  // 5. Summary
  const summary = await users.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]).toArray();

  console.log('\n📊 Current Role Distribution:');
  summary.forEach(r => console.log(`   ${r._id}: ${r.count} user(s)`));

  console.log('\n🎉 Migration completed successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
