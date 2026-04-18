const reminders = new Map();

function addReminder(userId, time, message, channel) {
  const id = Date.now().toString();
  reminders.set(id, { userId, time, message, channel });

  setTimeout(async () => {
    const reminder = reminders.get(id);
    if (reminder) {
      try {
        const user = await channel.client.users.fetch(userId);
        if (user) {
          user.send(`Reminder: ${message}`);
        }
      } catch {}
      reminders.delete(id);
    }
  }, time);

  return id;
}

function cancelReminder(id) {
  return reminders.delete(id);
}

function getUserReminders(userId) {
  return Array.from(reminders.entries())
    .filter(([, r]) => r.userId === userId)
    .map(([id, r]) => ({ id, ...r }));
}

module.exports = { addReminder, cancelReminder, getUserReminders };