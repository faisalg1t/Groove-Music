<div align="center">

# 🎵 Groove Music

![Groove Music](https://img.shields.io/badge/Groove-Music%20Bot-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-14+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)

**High-Quality • Fast • Reliable**

A powerful Discord music bot with LavaLink integration, featuring support for YouTube and Spotify, playlists, favorites, and much more!

[**Discord Server**](https://discord.gg/TGF3fCXtRm) • [**Bot-Hosting.net**](https://bot-hosting.net/?aff=alex) • [**Report Bug**](https://github.com/faisaljs/Groove-Music/issues) • [**Request Feature**](https://github.com/faisaljs/Groove-Music/issues)

</div>

---

## 🚀 Deploy on Bot-Hosting.net

Want to host **Groove Music** without setting up your own server? You can easily deploy it using **Bot-Hosting.net**.

## 💙 Get Started

👉 [**Click Here**](https://bot-hosting.net/?aff=alex) to create free **Bot-Hosting.net** account.

**After creating your account:**

1. Go to the **Templates** section in your Bot-Hosting.net dashboard.
2. Search for **Groove-Music**.
3. Select the **Groove-Music** template.
4. Deploy the template to your server.
5. Configure your required environment variables, including your Discord bot token and LavaLink credentials.
6. Start your bot and you're ready to enjoy **Groove Music**! 🎵

> 💡 **New to Bot-Hosting.net?** Use the button above to create your account, then find **Groove-Music** in the **Templates** section.

## 🎶 Quick & Easy

**Create Account → Templates → Groove-Music → Deploy → Configure → Start**

Enjoy hosting Groove Music on Bot-Hosting.net! 💙

---

## ✨ Features

- 🎶 **High-Quality Music Playback** - Powered by LavaLink for the best audio quality
- 🎵 **Multi-Platform Support** - Play from YouTube and Spotify
- 📝 **Playlist Management** - Create, save, and share custom playlists
- ⭐ **Favorites System** - Save your favorite tracks for quick access
- 🎼 **Queue Management** - Full control over your music queue
- 🎚️ **Audio Filters** - Apply various audio effects to customize your listening experience
- 🎤 **Lyrics Support** - Display lyrics for currently playing tracks
- 🔄 **Loop Modes** - Loop single tracks or entire queues
- ⏯️ **Playback Controls** - Play, pause, skip, shuffle, and more
- 🎲 **Autoplay** - Automatically queue similar songs when the queue ends
- 🖼️ **Beautiful Music Cards** - Custom artwork for now playing displays
- ⚡ **Slash Commands** - Modern Discord slash command support
- 📌 **Prefix Commands** - Traditional prefix commands (`,` by default)

---

## 📋 Commands Overview

### 🎵 Music Playback
- `/play` - Play a song or add it to the queue
- `/pause` - Pause the current track
- `/resume` - Resume playback
- `/skip` - Skip to the next track
- `/stop` - Stop playback and clear the queue
- `/nowplaying` - Display currently playing track
- `/queue` - View the current queue

### 🎛️ Queue Management
- `/shuffle` - Shuffle the queue
- `/clear` - Clear the entire queue
- `/remove` - Remove a specific track from the queue
- `/move` - Move a track to a different position
- `/back` - Go back to the previous track
- `/seek` - Seek to a specific position in the track

### 📝 Playlists
- `/playlist-save` - Save the current queue as a playlist
- `/playlist-load` - Load a saved playlist
- `/playlist-list` - View all your playlists
- `/playlist-delete` - Delete a playlist
- `/playlist-rename` - Rename a playlist
- `/playlist-share` - Share a playlist with others
- `/playlist-import` - Import a playlist from a link
- `/playlist-track-add` - Add a track to a playlist
- `/playlist-track-remove` - Remove a track from a playlist
- `/playlist-track-list` - View tracks in a playlist

### ⭐ Favorites
- `/favorite-add` - Add current track to favorites
- `/favorite-remove` - Remove a track from favorites
- `/favorite-list` - View all your favorite tracks
- `/favorite-play` - Play a track from your favorites

### 🎚️ Audio Settings
- `/volume` - Adjust the volume
- `/filter` - Apply audio filters
- `/loop` - Set loop mode (off/track/queue)
- `/autoplay` - Toggle autoplay mode

### ℹ️ Information
- `/help` - Display help information
- `/ping` - Check bot latency
- `/lyrics` - Display lyrics for the current track

---

## 🚀 Quick Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v84 or higher
- A Discord bot token ([Create one here](https://discord.com/developers/applications))
- LavaLink server (see [LavaLink Setup](#-lavalink-setup))
- (Optional) Spotify API credentials
- (Optional) Genius API key for lyrics

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/faisaljs/Groove-Music.git
   cd Groove-Music
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Bot Configuration
   BOT_TOKEN=your_discord_bot_token
   CLIENT_ID=your_bot_client_id
   
   # LavaLink Configuration
   LAVALINK_HOSTS=your.lavalink.host
   LAVALINK_PORTS=2333
   LAVALINK_PASSWORDS=youshallnotpass
   LAVALINK_SECURES=false
   
   # Optional: Genius Lyrics
   GENIUS_API_KEY=your_genius_api_key
   ```

4. **Configure bot settings**
   
   Edit `Groove-Music/config.js` to customize your bot:
   - Change the prefix (default: `,`)
   - Adjust playlist limits
   - Configure default music platform
   - Set artwork style

5. **Start the bot**
   ```bash
   npm start
   ```

---

## 🎸 LavaLink Setup

Groove Music requires a LavaLink server to function. You have two options:

### Option 1: Use a Public LavaLink Server
You can use free public LavaLink servers (not recommended for production):
- [LavaLink Public Servers List](https://lavalink.darrennathanael.com/)

### Option 2: Host Your Own LavaLink Server
1. Download LavaLink from [GitHub](https://github.com/lavalink-devs/Lavalink/releases)
2. Create an `application.yml` configuration file
3. Run LavaLink: `java -jar Lavalink.jar`
4. Update your `.env` with your LavaLink credentials

---

## 🎨 Customization

### Changing the Prefix
Edit `Groove-Music/config.js`:
```javascript
PREFIX: '!',  // Change to your desired prefix
```

### Adjusting Playlist Limits
```javascript
MUSIC: {
    PLAYLIST_LIMIT: 3,  // Maximum number of playlists per user
}
```

### Artwork Style
Choose between `MusicCard` (custom image card) or `Banner` (media gallery):
```javascript
MUSIC: {
    ARTWORK_STYLE: 'MusicCard'  // or 'Banner'
}
```

---

## 📁 Project Structure

```
Groove-Music/
├── commands/           # Slash commands
├── pCommands/          # Prefix commands
├── music/              # Music client and event handlers
├── helpers/            # Utility functions and helpers
├── utils/              # Logging, permissions, validation
├── database/           # Database models (favorites, playlists)
│   └── models/
├── assets/             # Images and resources
├── config.js           # Bot configuration
├── index.js            # Main entry point
└── emojis.json         # Custom emoji definitions
```

---

## 🔧 Troubleshooting

### Bot doesn't respond to commands
- Ensure the bot has proper permissions in your server
- Check that the bot token is correct
- Verify LavaLink is running and accessible

### Music doesn't play
- Confirm LavaLink server is online
- Check LavaLink credentials in `.env`
- Ensure the bot has `Connect` and `Speak` permissions in voice channels


---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 Credits

### Development Team

**Groove Music** is developed and maintained by **[Eleone Hub](https://discord.gg/TGF3fCXtRm)**

#### Lead Developer
- **Faisal** (faisaljs)
  - Discord: `alex.jsz`
  - Portfolio: [faisal.dev](https://faisaljs.github.io)

### Built With
- [Discord.js](https://discord.js.org/) - Discord API library
- [Poru](https://github.com/parasop/poru) - LavaLink client
- [LavaLink](https://github.com/lavalink-devs/Lavalink) - Audio delivery server
- [Sequelize](https://sequelize.org/) - Database ORM

### Special Thanks
- Eleone Hub community for testing and feedback
- All contributors who helped improve this project

---

## 📞 Support

Need help? Join our community!

- **Discord Server**: [https://discord.gg/TGF3fCXtRm](https://discord.gg/TGF3fCXtRm)
- **Developer Contact**: Discord @ `alex.jsz`
- **Portfolio**: [faisal.dev](https://faisaljs.github.io)

---

## 📄 License

This project is licensed under the MIT License.

---

## ⚠️ Disclaimer

This bot is for educational and entertainment purposes. Please respect copyright laws and Discord's Terms of Service when using this bot.

---

<div align="center">

**Made with ❤️ by [Eleone Hub](https://discord.gg/TGF3fCXtRm)**

[![Discord](https://img.shields.io/badge/Join-Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/TGF3fCXtRm)
[![Portfolio](https://img.shields.io/badge/Visit-Portfolio-FF6B6B?style=for-the-badge&logo=google-chrome&logoColor=white)](https://faisaljs.github.io)

**If you like this project, please consider giving it a ⭐ on GitHub!**

</div>
