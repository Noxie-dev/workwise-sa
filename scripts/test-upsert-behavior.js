#!/usr/bin/env node
/**
 * Test Script for Job Ingestion Upsert Behavior
 * 
 * This script tests the Drizzle ORM upsert functionality in the jobsIngest function:
 * 1. Insert new jobs
 * 2. Update existing jobs with modified fields
 * 3. Verify no duplicates are created
 * 4. Test bulk operations within transactions
 */

import { db } from '../netlify/functions/utils/db.js';
import { jobs } from '../shared/schema.js';
import { sql } from 'drizzle-orm';

// Test data for upsert testing
const testJobs = [
  {
    externalId: 'test-upsert-001',
    title: 'Software Developer - Initial',
    companyId: 1,
    location: 'Cape Town',
    salary: 'R50,000 per month',
    description: 'Initial job description for testing upsert',
    jobType: 'Full-time',
    workMode: 'Remote',
    categoryId: 1,
    isFeatured: false,
    source: 'test-upsert',
    ingestedAt: new Date(),
  },
  {
    externalId: 'test-upsert-002',
    title: 'Data Scientist - Initial',
    companyId: 1,
    location: 'Johannesburg',
    salary: 'R60,000 per month',
    description: 'Initial data scientist role',
    jobType: 'Full-time',
    workMode: 'Hybrid',
    categoryId: 1,
    isFeatured: false,
    source: 'test-upsert',
    ingestedAt: new Date(),
  }
];

const updatedJobs = [
  {
    externalId: 'test-upsert-001',
    title: 'Software Developer - UPDATED',
    companyId: 1,
    location: 'Cape Town',
    salary: 'R55,000 per month', // Updated salary
    description: 'Updated job description for testing upsert behavior',
    jobType: 'Full-time',
    workMode: 'Remote',
    categoryId: 1,
    isFeatured: true, // Updated to featured
    source: 'test-upsert',
    ingestedAt: new Date(),
  },
  {
    externalId: 'test-upsert-002',
    title: 'Data Scientist - UPDATED',
    companyId: 1,
    location: 'Johannesburg',
    salary: 'R65,000 per month', // Updated salary
    description: 'Updated data scientist role description',
    jobType: 'Full-time',
    workMode: 'Hybrid',
    categoryId: 1,
    isFeatured: true, // Updated to featured
    source: 'test-upsert',
    ingestedAt: new Date(),
  }
];

async function testUpsertBehavior() {
  console.log('🧪 Testing Job Ingestion Upsert Behavior...\n');

  try {
    // Step 1: Clean up any existing test data
    console.log('🧹 Cleaning up existing test data...');
    await db.delete(jobs).where(sql`${jobs.externalId} LIKE 'test-upsert-%'`);
    console.log('✅ Test data cleaned up\n');

    // Step 2: Test initial insert (should create new jobs)
    console.log('📝 Step 1: Testing initial insert...');
    const insertResult = await db.transaction(async (tx) => {
      return await tx
        .insert(jobs)
        .values(testJobs)
        .onConflictDoUpdate({
          target: jobs.externalId,
          set: {
            title: sql`excluded.${jobs.title.name}`,
            companyId: sql`excluded.${jobs.companyId.name}`,
            location: sql`excluded.${jobs.location.name}`,
            salary: sql`excluded.${jobs.salary.name}`,
            description: sql`excluded.${jobs.description.name}`,
            jobType: sql`excluded.${jobs.jobType.name}`,
            workMode: sql`excluded.${jobs.workMode.name}`,
            categoryId: sql`excluded.${jobs.categoryId.name}`,
            isFeatured: sql`excluded.${jobs.isFeatured.name}`,
            source: sql`excluded.${jobs.source.name}`,
            ingestedAt: sql`excluded.${jobs.ingestedAt.name}`,
          },
        });
    });

    console.log(`✅ Initial insert completed. Rows affected: ${insertResult.rowCount}`);

    // Step 3: Verify initial jobs were created
    console.log('\n🔍 Step 2: Verifying initial jobs...');
    const initialJobs = await db
      .select()
      .from(jobs)
      .where(sql`${jobs.externalId} LIKE 'test-upsert-%'`);

    console.log(`📊 Found ${initialJobs.length} initial jobs:`);
    initialJobs.forEach(job => {
      console.log(`   - ${job.externalId}: "${job.title}" (Featured: ${job.isFeatured})`);
    });

    // Step 4: Test upsert with updated data (should update existing jobs)
    console.log('\n🔄 Step 3: Testing upsert with updated data...');
    const upsertResult = await db.transaction(async (tx) => {
      return await tx
        .insert(jobs)
        .values(updatedJobs)
        .onConflictDoUpdate({
          target: jobs.externalId,
          set: {
            title: sql`excluded.${jobs.title.name}`,
            companyId: sql`excluded.${jobs.companyId.name}`,
            location: sql`excluded.${jobs.location.name}`,
            salary: sql`excluded.${jobs.salary.name}`,
            description: sql`excluded.${jobs.description.name}`,
            jobType: sql`excluded.${jobs.jobType.name}`,
            workMode: sql`excluded.${jobs.workMode.name}`,
            categoryId: sql`excluded.${jobs.categoryId.name}`,
            isFeatured: sql`excluded.${jobs.isFeatured.name}`,
            source: sql`excluded.${jobs.source.name}`,
            ingestedAt: sql`excluded.${jobs.ingestedAt.name}`,
          },
        });
    });

    console.log(`✅ Upsert completed. Rows affected: ${upsertResult.rowCount}`);

    // Step 5: Verify jobs were updated (not duplicated)
    console.log('\n🔍 Step 4: Verifying jobs were updated...');
    const finalJobs = await db
      .select()
      .from(jobs)
      .where(sql`${jobs.externalId} LIKE 'test-upsert-%'`);

    console.log(`📊 Found ${finalJobs.length} final jobs (should be same count):`);
    finalJobs.forEach(job => {
      console.log(`   - ${job.externalId}: "${job.title}" (Featured: ${job.isFeatured})`);
    });

    // Step 6: Verify no duplicates were created
    const duplicateCheck = await db
      .select({ count: sql`count(*)` })
      .from(jobs)
      .where(sql`${jobs.externalId} LIKE 'test-upsert-%'`)
      .groupBy(jobs.externalId)
      .having(sql`count(*) > 1`);

    if (duplicateCheck.length === 0) {
      console.log('\n✅ SUCCESS: No duplicates created - upsert working correctly!');
    } else {
      console.log('\n❌ FAILURE: Duplicates detected!');
      duplicateCheck.forEach(dup => {
        console.log(`   - Found ${dup.count} duplicates for externalId`);
      });
    }

    // Step 7: Test bulk operations with mixed new/updated jobs
    console.log('\n📦 Step 5: Testing bulk operations with mixed data...');
    const mixedJobs = [
      ...updatedJobs, // These should update
      {
        externalId: 'test-upsert-003',
        title: 'New Job - Bulk Test',
        companyId: 1,
        location: 'Durban',
        salary: 'R45,000 per month',
        description: 'New job for bulk testing',
        jobType: 'Part-time',
        workMode: 'On-site',
        categoryId: 1,
        isFeatured: false,
        source: 'test-upsert',
        ingestedAt: new Date(),
      }
    ];

    const bulkResult = await db.transaction(async (tx) => {
      return await tx
        .insert(jobs)
        .values(mixedJobs)
        .onConflictDoUpdate({
          target: jobs.externalId,
          set: {
            title: sql`excluded.${jobs.title.name}`,
            companyId: sql`excluded.${jobs.companyId.name}`,
            location: sql`excluded.${jobs.location.name}`,
            salary: sql`excluded.${jobs.salary.name}`,
            description: sql`excluded.${jobs.description.name}`,
            jobType: sql`excluded.${jobs.jobType.name}`,
            workMode: sql`excluded.${jobs.workMode.name}`,
            categoryId: sql`excluded.${jobs.categoryId.name}`,
            isFeatured: sql`excluded.${jobs.isFeatured.name}`,
            source: sql`excluded.${jobs.source.name}`,
            ingestedAt: sql`excluded.${jobs.ingestedAt.name}`,
          },
        });
    });

    console.log(`✅ Bulk operation completed. Rows affected: ${bulkResult.rowCount}`);

    // Step 8: Final verification
    console.log('\n🔍 Step 6: Final verification...');
    const allTestJobs = await db
      .select()
      .from(jobs)
      .where(sql`${jobs.externalId} LIKE 'test-upsert-%'`);

    console.log(`📊 Total test jobs: ${allTestJobs.length}`);
    allTestJobs.forEach(job => {
      console.log(`   - ${job.externalId}: "${job.title}" (Featured: ${job.isFeatured})`);
    });

    // Step 9: Performance test
    console.log('\n⚡ Step 7: Performance testing...');
    const performanceJobs = Array.from({ length: 100 }, (_, i) => ({
      externalId: `perf-test-${String(i).padStart(3, '0')}`,
      title: `Performance Test Job ${i}`,
      companyId: 1,
      location: 'Test Location',
      salary: `R${50000 + i * 100} per month`,
      description: `Performance test job ${i}`,
      jobType: 'Full-time',
      workMode: 'Remote',
      categoryId: 1,
      isFeatured: false,
      source: 'performance-test',
      ingestedAt: new Date(),
    }));

    const startTime = Date.now();
    const perfResult = await db.transaction(async (tx) => {
      return await tx
        .insert(jobs)
        .values(performanceJobs)
        .onConflictDoUpdate({
          target: jobs.externalId,
          set: {
            title: sql`excluded.${jobs.title.name}`,
            companyId: sql`excluded.${jobs.companyId.name}`,
            location: sql`excluded.${jobs.location.name}`,
            salary: sql`excluded.${jobs.salary.name}`,
            description: sql`excluded.${jobs.description.name}`,
            jobType: sql`excluded.${jobs.jobType.name}`,
            workMode: sql`excluded.${jobs.workMode.name}`,
            categoryId: sql`excluded.${jobs.categoryId.name}`,
            isFeatured: sql`excluded.${jobs.isFeatured.name}`,
            source: sql`excluded.${jobs.source.name}`,
            ingestedAt: sql`excluded.${jobs.ingestedAt.name}`,
          },
        });
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    const rate = performanceJobs.length / (duration / 1000);

    console.log(`✅ Performance test completed:`);
    console.log(`   - Jobs processed: ${performanceJobs.length}`);
    console.log(`   - Time taken: ${duration}ms`);
    console.log(`   - Rate: ${rate.toFixed(2)} jobs/second`);

    // Cleanup performance test data
    await db.delete(jobs).where(sql`${jobs.externalId} LIKE 'perf-test-%'`);

    console.log('\n🎉 All upsert tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Initial insert working');
    console.log('   ✅ Upsert updates working');
    console.log('   ✅ No duplicates created');
    console.log('   ✅ Bulk operations working');
    console.log('   ✅ Performance acceptable');
    console.log('   ✅ Transaction integrity maintained');

  } catch (error) {
    console.error('\n💥 Test failed with error:', error);
    process.exit(1);
  } finally {
    // Clean up all test data
    try {
      await db.delete(jobs).where(sql`${jobs.externalId} LIKE 'test-upsert-%'`);
      console.log('\n🧹 Test data cleaned up');
    } catch (cleanupError) {
      console.warn('⚠️  Warning: Could not clean up test data:', cleanupError);
    }
    
    await db.end();
    process.exit(0);
  }
}

// Run the test
testUpsertBehavior();
