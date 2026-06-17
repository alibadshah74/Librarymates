import mongoose from "mongoose";

const normalizeUsername = (value = '') => value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 40);

const buildNameKeywords = (value = '') => [...new Set(
    value
        .toString()
        .toLowerCase()
        .split(/[^a-z0-9_]+/)
        .filter((token) => token.length >= 3)
)];

const userSchema =  new mongoose.Schema({
    _id: {type: String, required: true},
    email: {type: String, required: true},
    full_name: {type: String, required: true},
    username: {type: String, unique: true, lowercase: true, trim: true},
    usernameSearch: {type: String, lowercase: true, trim: true},
    searchKeywords: [{type: String, lowercase: true, trim: true}],
    bio: {type: String, default: "Hey there! I am using Study Mate."},
    profile_picture: {type: String, default: ''},
    cover_photo: {type: String, default: ''},
    location: {type: String, default: ''},
    followers: [{type: String, ref: 'User'}],
    following: [{type: String, ref: 'User'}],
    mateRequests: [{type: String, ref: 'User'}],
    followingRequests: [{type: String, ref: 'User'}],
}, {timestamps: true, minimize: false})

userSchema.pre('validate', function normalizeUserSearchFields(next) {
    if (this.username) {
        this.username = normalizeUsername(this.username);
        this.usernameSearch = this.username;
    }
    this.searchKeywords = buildNameKeywords(this.full_name);
    next();
})

userSchema.index({ usernameSearch: 1 }, { unique: true, sparse: true })
userSchema.index({ searchKeywords: 1 })
userSchema.index({ full_name: 1 })

const User = mongoose.model('User', userSchema)

export default User
