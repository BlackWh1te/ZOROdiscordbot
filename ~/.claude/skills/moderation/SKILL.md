# Moderation Skill

## Overview
Advanced moderation with warnings, temp bans, mutes, and auto-enforcement.

## Step 1: Create Directory
```bash
mkdir -p ~/.claude/skills/moderation/data
```

## Step 2: Core Commands
- `!mod warn @user reason` - Warn user
- `!mod mute @user time` - Temp mute
- `!mod ban @user reason` - Ban user
- `!mod kick @user reason` - Kick user
- `!mod rules` - Show server rules
- `!mod violations @user` - Show user violations

## Step 3: Data Structure
```json
{
  "warnings": {"userId": ["reason1", "reason2"]},
  "mutes": {"userId": {"end": timestamp, "reason": "..."}},
  "bans": {"userId": {"end": timestamp, "reason": "..."}},
  "rules": ["No spam", "Be respectful", ...]
}
```

## Moderation Script (moderation.lua)
```lua
local moderation = {}

-- Check if user is muted/banned
function moderation.isRestricted(userId)
    -- Check mutes and bans
end

-- Apply punishment
function moderation.applyPunishment(userId, type, duration, reason)
    -- Warn, mute, ban, kick logic
end

-- Auto-moderation
function moderation.autoMod(message)
    -- Check bad words, spam, etc.
end

return moderation
```

## Integration
- Triggers on !mod prefix
- Stores violations in data/moderation.json
- Time-based temp bans/mutes
- Auto-logging of all actions
- Permission checks for mod hierarchy

## Auto-Enforcement
- Bad word filtering
- Spam detection
- Mention spam protection
- Mass DM prevention