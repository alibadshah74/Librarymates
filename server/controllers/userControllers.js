import imagekit from "../configs/imageKit.js"
import User from "../models/User.js"
import fs from 'fs'
import Post from "../models/Post.js"

const normalizeUsername = (value = '') => value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 40)

const userSelect = 'full_name username bio profile_picture location followers following mateRequests followingRequests'

const uniquePush = (list = [], value) => {
    if (!list.includes(value)) list.push(value)
}

export const generateUniqueUsername = async (baseUsername, excludeUserId = null) => {
    const fallback = `student_${Date.now()}`
    const base = normalizeUsername(baseUsername) || fallback
    const queryFor = (username) => ({
        $or: [{ usernameSearch: username }, { username }],
        ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {})
    })

    if (!await User.exists(queryFor(base))) return base

    let suffix = 1
    let candidate = `${base}_${suffix}`
    while (await User.exists(queryFor(candidate))) {
        suffix += 1
        candidate = `${base}_${suffix}`
    }
    return candidate
}

// Get user data using userId
export const getUserData = async (req, res) => {
    try {
        const { userId } = req.auth()
        const user = await User.findById(userId)
        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }
        res.json({ success: true, user })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}


// Update user data
export const updateUserData = async (req, res) => {
    try {
        const { userId } = req.auth()
        let { username, bio, location, full_name } = req.body;

        const tempUser = await User.findById(userId)

        !username && (username = tempUser.username)

        username = normalizeUsername(username)

        if (tempUser.username !== username) {
            username = await generateUniqueUsername(username, userId)
        }

        const updatedData = {
            username,
            bio,
            location,
            full_name,
        }

        const profile = req.files.profile && req.files.profile[0]
        const cover = req.files.cover && req.files.cover[0]

        if (profile) {
            const buffer = fs.readFileSync(profile.path)
            const response = await imagekit.upload({
                file: buffer,
                fileName: profile.originalname,
            })

            const url = imagekit.url({
                path: response.filePath,
                transformation: [
                    { quality: 'auto' },
                    { format: 'webp' },
                    { width: '512' },
                ]
            })
            updatedData.profile_picture = url;
        }

        if (cover) {
            const buffer = fs.readFileSync(cover.path)
            const response = await imagekit.upload({
                file: buffer,
                fileName: cover.originalname,
            })

            const url = imagekit.url({
                path: response.filePath,
                transformation: [
                    { quality: 'auto' },
                    { format: 'webp' },
                    { width: '1280' },
                ]
            })
            updatedData.cover_photo = url;
        }

        const user = await User.findByIdAndUpdate(userId, updatedData, {new: true})

        res.json({success: true, user, message: 'Profile updated successfully'})

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Find users by username or display name

export const discoverUsers = async (req, res) => {
    try {
        const { userId } = req.auth()
        const input = (req.body.input || req.query.search || '').trim()
        const page = Math.max(Number(req.body.page || req.query.page) || 1, 1)
        const limit = Math.min(Math.max(Number(req.body.limit || req.query.limit) || 12, 1), 30)
        const normalizedInput = normalizeUsername(input)
        if (!normalizedInput || normalizedInput.length < 3) {
            return res.json({
                success: true,
                users: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    pages: 1
                }
            })
        }

        const exactUsernameQuery = {
            $or: [
                { usernameSearch: normalizedInput },
                { username: normalizedInput },
            ]
        }
        const exactUser = await User.findOne(exactUsernameQuery).select(userSelect)

        if (exactUser) {
            return res.json({
                success: true,
                users: [exactUser],
                pagination: {
                    page: 1,
                    limit,
                    total: 1,
                    pages: 1
                }
            })
        }

        const query = { _id: { $ne: userId } }

        query.$or = [
            { usernameSearch: { $gte: normalizedInput, $lt: `${normalizedInput}\uffff` } },
            { username: { $gte: normalizedInput, $lt: `${normalizedInput}\uffff` } },
            { searchKeywords: normalizedInput },
        ]

        const [users, total] = await Promise.all([
            User.find(query)
                .select(userSelect)
                .sort({ usernameSearch: 1, full_name: 1 })
                .skip((page - 1) * limit)
                .limit(limit),
            User.countDocuments(query)
        ])

        res.json({
            success: true,
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit) || 1
            }
        })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Send mate request
export const followUser = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { id } = req.body;

        if (userId === id) {
            return res.json({ success: false, message: 'You cannot send a mate request to yourself' })
        }

        const user = await User.findById(userId)
        const toUser = await User.findById(id)

        if (!toUser) {
            return res.json({ success: false, message: 'User not found' })
        }
        
        if(user.following.includes(id)){
            return res.json({ success: false, message: 'You are already mates'})
        }

        if(user.mateRequests.includes(id)){
            user.mateRequests = user.mateRequests.filter(requesterId => requesterId !== id)
            toUser.followingRequests = toUser.followingRequests.filter(requestedId => requestedId !== userId)

            uniquePush(toUser.following, userId)
            uniquePush(user.followers, id)

            await Promise.all([user.save(), toUser.save()])

            return res.json({success: true, message: 'Mate request accepted'})
        }

        if(user.followingRequests.includes(id)){
            return res.json({ success: true, message: 'Mate request already sent'})
        }

        uniquePush(user.followingRequests, id)
        uniquePush(toUser.mateRequests, userId)

        await Promise.all([user.save(), toUser.save()])

        res.json({success: true, message: 'Mate request sent'})

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

export const acceptMateRequest = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { id } = req.body;

        const user = await User.findById(userId)
        const requester = await User.findById(id)

        if (!requester) {
            return res.json({ success: false, message: 'User not found' })
        }

        if (!user.mateRequests.includes(id)) {
            return res.json({ success: false, message: 'Mate request not found' })
        }

        user.mateRequests = user.mateRequests.filter(requesterId => requesterId !== id)
        requester.followingRequests = requester.followingRequests.filter(requestedId => requestedId !== userId)

        uniquePush(requester.following, userId)
        uniquePush(user.followers, id)

        await Promise.all([user.save(), requester.save()])

        res.json({success: true, message: 'Mate request accepted'})

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

export const declineMateRequest = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { id } = req.body;

        const user = await User.findById(userId)
        const requester = await User.findById(id)

        user.mateRequests = user.mateRequests.filter(requesterId => requesterId !== id)
        if (requester) {
            requester.followingRequests = requester.followingRequests.filter(requestedId => requestedId !== userId)
            await requester.save()
        }
        await user.save()

        res.json({success: true, message: 'Mate request declined'})

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Unfollow User
export const unfollowUser = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { id } = req.body;

        const user = await User.findById(userId)
        user.following = user.following.filter(userId => userId !== id);
        user.followingRequests = user.followingRequests.filter(userId => userId !== id);
        await user.save();

        const toUser = await User.findById(id);
        if (toUser) {
            toUser.followers = toUser.followers.filter(followerId => followerId !== userId);
            toUser.mateRequests = toUser.mateRequests.filter(followerId => followerId !== userId);
            await toUser.save();
        }

        res.json({success: true, message: 'Mate removed'})

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

export const getMateRequests = async (req, res) => {
    try {
        const { userId } = req.auth()
        const user = await User.findById(userId).populate('mateRequests', 'full_name username profile_picture bio followers following')
        res.json({ success: true, requests: user.mateRequests || [] })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message})
    }
}

export const getUserNetwork = async (req, res) => {
    try {
        const { userId } = req.auth()
        const user = await User.findById(userId).populate('followers following')
        
        const followers = user.followers
        const following = user.following
        const peopleById = new Map()

        followers.forEach((person) => peopleById.set(person._id, person))
        following.forEach((person) => peopleById.set(person._id, person))

        res.json({ success: true, followers, following, people: [...peopleById.values()]})


    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message})
    }
}

// Get User Profiles
export const getUserProfiles = async (req, res) => {
    try {
        const { profileId } =req.body;
        const profile = await User.findById(profileId).populate('followers following', 'full_name username profile_picture bio followers following')
        if(!profile){
            return res.json({ success: false, message: "profile not found" });
        }
        const posts = await Post.find({user: profileId, isDeleted: { $ne: true }}).populate('user').populate('studyMaterial').sort({ createdAt: -1 })
        res.json({ success: true, profile, posts})
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message})
    }
}
