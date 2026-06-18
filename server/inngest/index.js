import { Inngest } from "inngest";
import User from "../models/User.js";
import sendEmail from "../configs/nodeMailer.js";
import Story from "../models/Story.js";
import Message from "../models/Message.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "study-mate-app" });

const normalizeUsername = (value = '') => value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 40)

const generateUniqueUsername = async (baseUsername) => {
    const base = normalizeUsername(baseUsername) || `student_${Date.now()}`
    const exists = (username) => User.exists({ $or: [{ usernameSearch: username }, { username }] })

    if (!await exists(base)) return base

    let suffix = 1
    let candidate = `${base}_${suffix}`
    while (await exists(candidate)) {
        suffix += 1
        candidate = `${base}_${suffix}`
    }
    return candidate
}

const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk', triggers: [{ event: 'clerk/user.created' }] },
    async ({ event }) => {

        console.log("========== USER CREATED EVENT ==========");
        console.log(event.data);

        const { id, first_name, last_name, email_addresses, image_url } = event.data;

        const username = await generateUniqueUsername(
            email_addresses[0].email_address.split('@')[0]
        );

        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            full_name: first_name + " " + last_name,
            profile_picture: image_url,
            username
        };

        console.log("Creating User:", userData);

        await User.create(userData);

        console.log("User Saved Successfully");
    }
);

// Inngest function to update user data in database
const syncUserUpdation = inngest.createFunction(
    { id: 'update-user-from-clerk', triggers: [{ event: 'clerk/user.updated' }] },
    async ({event}) =>{
        const {id, first_name, last_name, email_addresses, image_url} = event.data
    
    const updateUserData ={
        email: email_addresses[0].email_address,
        full_name: first_name + ' ' + last_name,
        profile_picture: image_url
    }
    await User.findByIdAndUpdate(id, updateUserData)

    }
)

// Inngest function to delete user data in database
const syncUserDeletion = inngest.createFunction(
    { id: 'delete-user-from-clerk', triggers: [{ event: 'clerk/user.deleted' }] },
    async ({event}) =>{
       const {id} = event.data
       await User.findByIdAndDelete(id)
    
    }
)

// Inngest Function to delete story after 24 hours
const deleteStory = inngest.createFunction(
    { id: 'story_delete', triggers: [{ event: 'app/story.delete' }] },
    async ({ event, step }) => {
        const { storyId } = event.data;
        const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000)
        await step.sleepUntil('wait-for-hours', in24Hours)
        await step.run('delete-story', async () => {
            await Story.findByIdAndDelete(storyId)
            return { message: "Story deleted."}
        })
    }
)

const sendNotificationOfUnSeenMessages = inngest.createFunction(
    { id: "send-unseen-messages-notification", triggers: [{ cron: "TZ=America/New_York 0 9 * * *" }] }, // Every Day 9 AM
    async ({step}) => {
        const messages = await Message.find({seen: false}).populate('to_user_id');
        const unseenCount = {}
        
        messages.map(message => {
            unseenCount[message.to_user_id] = (unseenCount[message.to_user_id._id] || 0)
            + 1;
        })

        for (const userId in unseenCount) {
            const user = await User.findById(userId);

            const subject = `You have ${unseenCount[userId]} unseen messages.`;

            const body = `
            <div style="font-family: Arial, sans-serif; padding: 20px">
                <h2>Hi ${user.full_name},</h2>
                <p>Yoh have ${unseenCount[userId]} unseen messages </p>
                <p>Click <a href="${process.env.FRONTEND_URL}/messages" style="color: #10b981;">here</a> to view them</p>
                <br />
                <p>Thanks, <br />Study Mate</p>
            </div>
            `;

            await sendEmail({
                to: user.email,
                subject,
                body
            })
        }
        return {message: "Notification sent"}
    }
)

// Create an empty array where we'll export future Inngest functions
export const functions = [
    syncUserCreation,
    syncUserUpdation,
    syncUserDeletion,
    deleteStory,
    sendNotificationOfUnSeenMessages
];
