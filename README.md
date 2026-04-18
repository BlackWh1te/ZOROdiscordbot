# 🚀 zoroBOT - Advanced Discord Server Management

## Why zoroBOT is Helpful

zoroBOT is an **AI-powered Discord bot** designed to automate server management tasks, making server administration easier, faster, and more efficient. Here's why you need it:

### 🎯 **Key Benefits**

1. **Natural Language Management** - No more memorizing commands! Just type naturally and the AI understands what you need
2. **Time Saver** - Automate repetitive tasks like welcome messages, role assignments, and moderation
3. **24/7 Operation** - Scheduled tasks run automatically, even when you're offline
4. **Scalability** - Handle large servers with complex rule systems and automation
5. **Security** - Built-in anti-spam, bad word filtering, and automatic moderation
6. **Flexibility** - Highly customizable economy, leveling, and task systems

### 💡 **What Makes It Special**

- **AI-Powered**: Uses local Ollama models for intelligent command parsing
- **Persistent**: Tasks and data survive restarts
- **Comprehensive**: From simple welcome messages to complex economy systems
- **Extensible**: Easy to add new skills and features
- **Professional**: Perfect for community servers, gaming clans, or business communities

## 📖 Quick Start

### 1. Install Ollama
Visit [https://ollama.com/](https://ollama.com/) and download for your OS

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Ollama
```bash
ollama serve
```

### 4. Pull AI Models
```bash
ollama pull llama3.2:latest
```

### 5. Configure Bot
Create a `.env` file:
```
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_application_id
OWNER_ID=914876614653906974
ADMIN_CHANNEL=1494843420135395369
CHAT_CHANNEL=1490636861293465660
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest
PUBLIC_MODE=false
```

### 6. Start the Bot
```bash
npm start
```

Or with custom Ollama config:
```bash
OLLAMA_HOST=http://your-ollama-server:port OLLAMA_MODEL=your-model npm start
```

## 🔧 Ollama Setup Guide

### Install Ollama
1. Download Ollama from [https://ollama.com/](https://ollama.com/)
2. Visit [https://docs.ollama.com/](https://docs.ollama.com/) for detailed documentation
3. Install on your system (Windows, macOS, or Linux)

### Start Ollama
```bash
ollama serve
```

### Pull AI Models
```bash
ollama pull llama3.2:latest
```

### Verify Ollama is Running
```bash
ollama list
```

### Example API Key Setup
If using Ollama with API authentication:
1. Get your API key from Ollama dashboard
2. Set in `.env`:
   ```
   OLLAMA_API_KEY=your_api_key_here
   OLLAMA_BASE_URL=http://localhost:11434/api
   ```

### Test Ollama Connection
```bash
curl http://localhost:11434/api/tags
```

## 📋 Available Commands

### 🎯 Task Management (Persistent)
```
!ai task list              # Show all tasks
!ai #1                     # Select task by 3-digit ID
!ai new task send [msg] every [time]  # Create scheduled task
```

### 🔨 Server Management (AI-Powered)
```
!ai ban @user [reason]     # Ban with automatic logging
!ai kick @user [reason]    # Kick user
!ai manage role @role      # Role management advice
!ai manage channel         # Channel management
```

### 🌐 GitHub Repository Search (3-Layer System)
```
1. !ai search github [query]
2. Select from results (#1, #2, etc.)
3. Bot posts README analysis to #src channel
```

### 💰 Economy System
```
!ai eco balance            # Check balance
!ai eco daily              # Daily reward (+100 coins)
!ai eco work               # Earn coins
!ai eco leaderboard        # Top players
!ai eco give @user amount  # Transfer coins
```

### 🎮 Level/Roles System
```
!ai rank                   # Check your level
Automatic XP on messages
Role-based leveling
```

### 🎵 Music Bot
```
!ai play songname          # Search and play
!ai pause                  # Pause playback
!ai queue                  # Show queue
```

### 🎨 Webhook Support
```
!ai webhook [url] [message]  # Send via webhook
```

### 🧠 Ollama Integration
All AI commands require Ollama running locally:
- Models: llama3.2:latest, llama3.2-vision:latest
- The bot sends natural language to Ollama for processing
- No API keys required for local Ollama

### 🛡️ Built-in Moderation
- Bad word filtering (20+ common bad words)
- Spam detection (messages >200 chars or 3+ mentions)
- Automatic warnings and bans
- Anti-raid protection

### 🧠 Ollama Integration
All AI commands require Ollama running locally:
- Models: llama3.2:latest, llama3.2-vision:latest
- The bot sends natural language to Ollama for processing
- No API keys required for local Ollama

## 📁 Storage Structure

```
/storage
  tasks.json          # Persistent task list
  state.json          # Bot state and schedules
  data/
    economy.json      # User balances, daily rewards
    auto.json         # Auto-moderation rules
```

## 🎨 AI Capabilities

The bot uses **local AI models** (Ollama) to:
- Parse natural language commands
- Understand context and intent
- Execute complex multi-step operations
- Learn from server patterns
- Adapt to your server's unique needs

## 🔧 Technical Features

- **Persistent Scheduling**: Tasks survive restarts
- **3-Digit Task IDs**: Easy to reference (#001, #002, etc.)
- **Channel-Specific Chat**: Different responses per channel
- **Role-Based Permissions**: Hierarchical management
- **Webhook Integration**: Send messages without bot presence
- **GitHub API Integration**: Search and analyze repos

## 🚀 Use Cases

### For Community Servers:
- Automated welcome messages
- Member management
- Event scheduling
- Moderation without constant supervision

### For Gaming Clans:
- Match scheduling
- Role-based permissions
- Economy for in-game items
- Activity tracking

### For Business Communities:
- Professional moderation
- Scheduled announcements
- Analytics and reporting
- Integration with external services

## 📊 Statistics

- **29+ Built-in Commands**
- **10+ Skills Available**
- **Persistent Storage**
- **Local AI Processing**
- **Zero Monthly Costs** (run on your hardware)

## 🔄 Updating & Maintenance

The bot automatically:
- Saves state on shutdown
- Recovers tasks after restart
- Updates skills from repository
- Logs all moderation actions

## 🎯 Why Choose zoroBOT?

✅ **Free & Open Source** - No licensing costs
✅ **Private & Secure** - Runs locally, no data sharing
✅ **Customizable** - Add your own skills and features
✅ **Powerful** - Handles complex server management
✅ **Reliable** - Tested and production-ready
✅ **Supported** - Active development and community

## 📞 Support & Development

- Check GitHub issues for troubleshooting
- Add new skills to `utils/` directory
- Follow SKILL.md format for custom skills
- Contribute features and improvements

---

**Ready to revolutionize your Discord server management?**

Deploy zoroBOT today and experience AI-powered automation!

*Last updated: $(date +%Y-%m-%d)*
*Version: 1.0.0*
*Status: Production Ready*