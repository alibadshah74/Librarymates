import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import StudyMaterial, { buildStudyMaterialSearchData } from '../models/StudyMaterial.js';

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

const mongoUrl = `${process.env.MONGODB_URL}/${process.env.MONGODB_DB_NAME || 'pingup'}`;

await mongoose.connect(mongoUrl);

const materials = await StudyMaterial.find({
    $or: [
        { searchableKeywords: { $exists: false } },
        { searchableKeywords: { $size: 0 } },
        { searchablePhrases: { $exists: false } },
    ]
});

for (const material of materials) {
    const searchData = buildStudyMaterialSearchData(material);
    material.searchableKeywords = searchData.searchableKeywords;
    material.searchablePhrases = searchData.searchablePhrases;
    material.downloadCount = material.downloadCount || material.downloadsCount || 0;
    material.viewCount = material.viewCount || material.viewsCount || 0;
    material.commentsCount = material.commentsCount ?? (material.comments?.length || 0);
    await material.save();
}

const users = await User.find({
    $or: [
        { usernameSearch: { $exists: false } },
        { searchKeywords: { $exists: false } },
    ]
});

for (const user of users) {
    user.username = normalizeUsername(user.username);
    user.usernameSearch = user.username;
    user.searchKeywords = buildNameKeywords(user.full_name);
    await user.save();
}

console.log(`Backfilled ${materials.length} study materials and ${users.length} users.`);
await mongoose.disconnect();
