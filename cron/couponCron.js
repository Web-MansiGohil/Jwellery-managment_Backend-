import cron from "node-cron";
import { Coupon } from "../Models/Coupon.js";
import { User } from "../Models/User.js";
import { sendEmail } from "../utils/sendEmail.js";
import { deactivateExpiredCoupons } from "../Controllers/couponController.js";


// Run every day at 08:00 AM
cron.schedule("0 8 * * *", async () => {
    try {
        console.log("Running daily coupon expiry check...");
        
        // Deactivate any coupons that have expired
        await deactivateExpiredCoupons();

        const now = new Date();

        const fourDaysFromNow = new Date();
        fourDaysFromNow.setDate(now.getDate() + 4);


        // Find coupons that are active, not deleted, and end within the next 4 days but haven't ended yet
        const endingCoupons = await Coupon.find({
            is_active: true,
            is_deleted: false,
            end_date: {
                $gt: now, // still running
                $lte: fourDaysFromNow // ending within 4 days
            }
        });

        if (endingCoupons.length === 0) {
            console.log("No coupons are ending soon.");
            return;
        }

        // Get all active customers
        const customers = await User.find({ role: "Customer", is_active: true, is_deactive: false });

        if (customers.length === 0) {
            console.log("No active customers to email.");
            return;
        }

        for (const coupon of endingCoupons) {
            // Calculate days left
            const diffTime = Math.abs(coupon.end_date - now);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const subject = `Hurry! Coupon ${coupon.discount_name} is ending in ${diffDays} day(s)!`;
            const text = `Hi, don't forget to use your coupon '${coupon.discount_name}' (${coupon.discount_value}${coupon.discount_type === 'Percentage' ? '%' : ' flat'} OFF) before it expires on ${coupon.end_date.toDateString()}.`;

            // Loop through customers and email them
            for (const c of customers) {
                try {
                    await sendEmail(c.email, subject, text);
                } catch (err) {
                    console.error(`Failed to send email to ${c.email}`, err);
                }
            }
        }

        console.log(`Coupon expiry check completed. Sent alerts for ${endingCoupons.length} coupons.`);
    } catch (error) {
        console.error("Error in coupon expiry cron job:", error);
    }
});

export default cron;
