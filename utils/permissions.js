const OWNER_ID = process.env.OWNER_ID;

function isOwner(userId) {
  if (!OWNER_ID || OWNER_ID === "your_discord_user_id_here") {
    return true;
  }
  return userId === OWNER_ID;
}

module.exports = { isOwner };