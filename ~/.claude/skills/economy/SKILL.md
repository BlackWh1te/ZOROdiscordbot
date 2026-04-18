# Economy Management Skill

## Overview
Provides a full economy system with balances, daily rewards, transactions, and jobs.

## Step 1: Create Directory
```bash
mkdir -p ~/.claude/skills/economy/data
```

## Step 2: Core Commands
- `!eco balance` - Check your balance
- `!eco daily` - Claim daily reward
- `!eco work` - Work for coins
- `!eco leaderboard` - Show top players
- `!eco give @user amount` - Transfer coins
- `!eco set-jobs` - Configure jobs

## Step 3: Data Files
- `data/economy.json` - Balances, daily timestamps, jobs
- `data/shop.json` - Item shop configuration

## Economy Script (economy.lua)
```lua
-- economy module
local economy = {}

function economy.load()
    -- Load JSON data
end

function economy.save()
    -- Save JSON data
end

function economy.getBalance(userId)
    -- Return user balance
end

function economy.addBalance(userId, amount)
    -- Add coins to balance
end

function economy.daily(userId)
    -- Daily reward logic
end

return economy
```

## Integration
- Triggers on !eco prefix
- Stores data in data/economy.json
- Auto-saves after each transaction
- Prevents negative balances
- Cooldown tracking for daily rewards