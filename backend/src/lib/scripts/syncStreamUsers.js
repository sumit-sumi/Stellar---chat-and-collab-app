// backend/src/lib/scripts/syncStreamUsers.js

import { StreamChat } from "stream-chat";
import User from "../../models/User.js"; // adjust relative path

export const syncStreamUsers = async (apiKey, apiSecret) => {
  try {
    const streamClient = StreamChat.getInstance(apiKey, apiSecret);
    const users = await User.find();

    if (!users.length) {
      console.log("⚠️ No users found to sync");
      return;
    }

    const streamUsers = users.map((u) => ({
      id: u._id.toString(),
      name: u.fullName,
      image: u.profilePic || "",
    }));

    const batchSize = 100;
    for (let i = 0; i < streamUsers.length; i += batchSize) {
      const batch = streamUsers.slice(i, i + batchSize);
      await streamClient.upsertUsers(batch);
      console.log(`✅ Upserted ${batch.length} users`);
    }

    console.log("🎉 Stream user sync complete!");
  } catch (err) {
    console.error("❌ Stream sync failed:", err.message);
  }
};
