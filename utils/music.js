const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, VoiceConnectionStatus } = require("@discordjs/voice");
const playdl = require("play-dl");

const queues = new Map();

async function getQueue(guildId) {
  if (!queues.has(guildId)) {
    queues.set(guildId, []);
  }
  return queues.get(guildId);
}

async function play(guildId, channel, client) {
  const queue = await getQueue(guildId);
  if (queue.length === 0) return;

  const song = queue[0];

  try {
    const stream = await playdl.stream(song.url, { quality: 2 });
    const resource = createAudioResource(stream.stream, { inputType: stream.type });

    const player = createAudioPlayer();
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guildId,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    connection.subscribe(player);
    player.play(resource);

    player.on("idle", async () => {
      queue.shift();
      if (queue.length > 0) {
        play(guildId, channel, client);
      } else {
        connection.destroy();
      }
    });

    const channelMsg = client.channels.cache.get(channel.id);
    if (channelMsg) {
      channelMsg.send(`Now playing: **${song.title}**`);
    }
  } catch (error) {
    console.error("Play error:", error);
  }
}

async function addSong(guildId, channel, query, client) {
  try {
    const info = await playdl.search(query, { limit: 1 });
    if (!info.length) return "No results found.";

    const song = {
      title: info[0].title,
      url: info[0].url,
    };

    const queue = await getQueue(guildId);
    queue.push(song);

    if (queue.length === 1) {
      play(guildId, channel, client);
    }

    return `Added: **${song.title}**`;
  } catch (error) {
    console.error("AddSong error:", error);
    return "Error adding song.";
  }
}

async function skip(guildId) {
  const queue = await getQueue(guildId);
  if (queue.length === 0) return "Nothing to skip.";

  queue.shift();
  return "Skipped!";
}

async function stop(guildId) {
  const queue = await getQueue(guildId);
  queue.length = 0;
  return "Stopped!";
}

async function queue(guildId) {
  const queue = await getQueue(guildId);
  if (queue.length === 0) return "Queue is empty.";

  return queue.map((s, i) => `${i + 1}. ${s.title}`).join("\n");
}

module.exports = { addSong, skip, stop, queue, getQueue };