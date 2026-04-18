-- Skill: Economy System
-- Description: Provides economy/currency system for Discord server
-- Trigger: Commands starting with !eco
-- Storage: data/economy.json

-- Economy Management Skill
-- Provides currency system, daily rewards, and transaction tracking

## Step 1: Create economy data directory
```bash
mkdir -p ~/.claude/skills/economy/script
mkdir -p ~/.claude/skills/economy/data
```

## Step 2: Create the economy script

```lua
-- economy.lua
local economy = {}

-- Load economy data
function economy.load()
    local file = io.open("/root/.claude/data/economy.json", "r")
    if file then
        local data = file:read("*all")
        file:close()
        return data and json.decode(data) or { balances = {}, daily = {} }
    end
    return { balances = {}, daily = {} }
end

-- Save economy data
function economy.save(data)
    local file = io.open("/root/.claude/data/economy.json", "w")
    file:write(json.encode(data))
    file:close()
end

-- Get user balance
function economy.getBalance(userId)
    local data = economy.load()
    return data.balances[userId] or 0
end

-- Add balance
function economy.addBalance(userId, amount)
    local data = economy.load()
    data.balances[userId] = (data.balances[userId] or 0) + amount
    economy.save(data)
    return data.balances[userId]
end

-- Daily reward
function economy.dailyReward(userId)
    local data = economy.load()
    local now = os.time()
    local last = data.daily[userId] or 0
    
    if now - last >= 86400 then -- 24 hours
        data.balances[userId] = (data.balances[userId] or 0) + 100
        data.daily[userId] = now
        economy.save(data)
        return 100, true
    end
    return 0, false
end

return economy