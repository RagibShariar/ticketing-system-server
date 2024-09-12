import cron from 'node-cron';
import prisma from '../shared/prisma';

// Schedule the task to run every minute to check for expired OTPs
cron.schedule('* * * * *', async () => {
  console.log('Running cron job to delete expired OTPs...');

  const now = new Date();

  try {
    // Delete OTP records where the expiresAt time has passed
    const result = await prisma.oTPVerification.deleteMany({
      where: {
        expiresAt: {
          lt: now, // Less than the current time
        },
      },
    });

    console.log(`Deleted ${result.count} expired OTP records.`);
  } catch (error) {
    console.error('Error deleting expired OTPs:', error);
  }
});
