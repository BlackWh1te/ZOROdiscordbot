# Music Bot Skill

## Overview
Voice channel music playback using Discord voice connections.

## Step 1: Create Directory
```bash
mkdir -p ~/.claude/skills/music/data
```

## Step 2: Core Commands
- `!play songname` - Search and play song
- `!pause` - Pause playback
- `!resume` - Resume playback
- `!skip` - Skip current song
- `!stop` - Stop playback
- `!queue` - Show queue
- `!volume` - Adjust volume

## Step 3: Features
- YouTube search and playback
- Queue management
- Auto-disconnect on inactivity
- Multiple voice channels
- Song voting/skip

## Music Script (music.lua)
```lua
local music = {}

function music.connect(channel)
    -- Connect to voice channel
end

function music.playSong(url)
    -- Play audio
end

function music.search(query)
    -- YouTube search
end

return music
```

## Integration
- Voice connection handling
- Queue persistence
- Error handling for unavailable songs
- Auto-cleanup of inactive connections