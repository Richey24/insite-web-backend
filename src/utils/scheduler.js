import cron from 'node-cron';
import BlogPost from '../models/BlogPost.js';

// ── Auto-publish scheduler ────────────────────────────────────────────────────
// Runs every minute. Finds all posts where:
//   status === 'scheduled' AND scheduledAt <= now
// Flips them to 'published', sets publishedAt to now (actual publish time),
// and clears scheduledAt (the editor's intended time is preserved in history
// via the scheduledAt field that was set — we leave it as-is for audit trail).

const publishDuePosts = async () => {
  try {
    const now = new Date();

    const result = await BlogPost.updateMany(
      {
        status:      'scheduled',
        scheduledAt: { $lte: now },
      },
      {
        $set: {
          status:      'published',
          publishedAt: now,        // actual publish time — set by the system
        },
        // Note: we intentionally leave scheduledAt intact as an audit trail
        // of when the editor originally intended the post to go live.
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[Scheduler] Auto-published ${result.modifiedCount} post(s) at ${now.toISOString()}`);
    }
  } catch (err) {
    console.error('[Scheduler] Error during auto-publish run:', err.message);
  }
};

// ── Start the scheduler ───────────────────────────────────────────────────────
// Cron expression: '* * * * *' = every minute
// node-cron docs: https://www.npmjs.com/package/node-cron

export const startScheduler = () => {
  cron.schedule('* * * * *', publishDuePosts, {
    scheduled: true,
    timezone: 'America/Los_Angeles', // InSite HQ — San Diego, CA
  });
  console.log('[Scheduler] Post auto-publish scheduler started (runs every minute, America/Los_Angeles).');
};
