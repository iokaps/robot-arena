# Code-A-Bot Arena - Host Guide

## What Is Code-A-Bot Arena?

Code-A-Bot Arena is a **real-time multiplayer strategy game** where players program their robots' moves and watch them battle on a shared arena. It's designed for **group play** with interactive gameplay, combining strategy and real-time excitement.

- **Players** join via mobile phones or tablets and program their robot's moves in 60-second rounds
- **Host** controls the game flow, starts matches, and manages the session
- **Presenter Screen** displays the arena battle to spectators (TV, projector, or shared screen)
- **Arena Size** is fixed at 14×14 for every match

---

## Who Should Host This Game?

This game works well for:

### 👨‍🏫 **Teachers & Educators**

- Teach programming logic and strategy in an engaging way
- Classroom size: 5-10 students per session
- Great for STEM curriculum, coding clubs, or computer science classes

### 🎉 **Event Organizers**

- School events, corporate team building, game nights, conferences
- Works for small gatherings (4-6 people) up to 10 active players per session
- Requires minimal setup - just WiFi and a projector/large screen

### 👥 **Casual Groups**

- Friends playing together for entertainment
- Gaming meetups or casual competitions
- Works with 2-10 players

---

## When to Use Code-A-Bot Arena

| Scenario                      | Good Fit?  | Notes                                             |
| ----------------------------- | ---------- | ------------------------------------------------- |
| Classroom lesson (30-60 mins) | ✅ Yes     | Perfect for teaching logic & strategy             |
| After-school coding club      | ✅ Yes     | Engaging, fun way to apply programming concepts   |
| Team building event           | ✅ Yes     | Encourages strategy & teamwork                    |
| Game night with friends       | ✅ Yes     | Works for casual entertainment                    |
| Very large audience (100+)    | ⚠️ Limited | Works, but limit active players to 10 per session |

---

## How to Set Up & Run as Host

### **Prerequisites**

Before you start, you need:

- ✅ **A computer** (laptop or desktop) to run the game
- ✅ **WiFi or local network** so players can join
- ✅ **A display screen** (optional but recommended):
  - TV, projector, or monitor to show the presenter view to spectators
  - Helps players see the battle unfold
- ✅ **Player devices** (phones or tablets):
  - Players need to access a join link to play
  - Any modern browser works

---

### **Step 1: Access the Game**

#### **Option A: Through Kokimoki Platform** (Recommended for most users)

1. Go to [kokimoki.com/games/robot-arena](https://kokimoki.com/games/robot-arena) _(or your custom hosting URL)_
2. You'll see the **Host Console**
3. Log in or create an account if required

#### **Option B: Local Network** (For developers)

If you're running the game locally:

```bash
# 1. Open terminal/command prompt
# 2. Navigate to the game folder
cd /path/to/robot-arena

# 3. Install if first time
npm install

# 4. Start the development server
npm run dev

# 5. Open browser to: http://localhost:5173
```

---

### **Step 2: Start a New Session**

On the **Host screen**, you'll see:

1. **"Start New Game"** button
2. You'll receive:
   - 🔗 **Player Link** - Share with players to join
   - 🎤 **Presenter Link** - Display on big screen for spectators
   - 📱 **QR Code** - Players can scan to join quickly

---

### **Step 3: Help Players Join**

#### **For younger players or groups:**

1. **Display the QR code** on your screen or projector
2. Players **scan with their phone camera**
3. They enter their **pilot name** and tap **"Join Arena"**

#### **For individual players:**

1. Share the **player link** via:
   - Text/email
   - Displayed on screen
   - QR code (easiest)
2. Players click the link and enter their name

#### **What players see on their devices:**

- Their robot's color and name
- The programming interface
- Countdown timer when game starts

---

### **Step 4: Configure the Game**

Before starting, you'll see options to customize:

- **Arena layout preview** - Review the fixed Open arena and its obstacle layout
- **Player count** - Match supports 2-10 players
- **Game duration** - How many rounds to play

---

### **Step 5: Start the Match**

1. **Wait for players** - You need at least 2 players
2. **Check the roster** - Lock the player list once everyone has joined
3. **Press "Start Match"**

The game now goes through these phases automatically:

#### **Lobby Phase** (5-30 seconds)

- Players see the welcome screen
- You show the presenter view for excitement

#### **Programming Phase** (60 seconds)

- ⏱️ Each player programs up to 5 moves for their robot
- They see the commands: Move Forward, Rotate, Shoot (empty slots do nothing)
- **TIP:** First time? Introduce the commands and give them confidence!

#### **Execution Phase** (10-20 seconds)

- 🤖 All robots execute simultaneously
- Presenter screen shows the arena battle
- Players watch robots move, collide, and shoot
- Last robot standing gets a point

#### **Repeat**

- 3 rounds total (by default)
- New lobbies between rounds with scores shown

#### **Results**

- Final standings and winner announced
- Presenter screen shows trophy/leaderboard

---

### **Step 6: Manage During the Game**

#### **Your Responsibilities as Host:**

| Time                                       | What to Do                                     |
| ------------------------------------------ | ---------------------------------------------- |
| **Setup (2 mins)**                         | Review arena layout and settings               |
| **Lobby (5 mins)**                         | Wait for players, display QR code              |
| **Programming Phase (1-2 mins per round)** | Monitor players programming, answer questions  |
| **Execution Phase (30 secs per round)**    | Watch with spectators! Narrate if fun          |
| **Between Rounds**                         | Prepare next round, cheer on remaining players |

#### **Common Host Actions:**

- ✅ **Pause the game** - If you need to stop for any reason
- ✅ **Kick a player** - In case of disruptive behavior _(optional feature)_
- ✅ **Start next match** - After results, restart with same or new players
- ✅ **Spectator mode** - Allow late-joining players to watch current match

---

## Quick Tips for Success

### 🎮 **Gameplay Tips**

- **First time?** Run a practice round so players understand the controls
- **Explain the arena** - Show how a 60-second round works
- **Encourage strategy** - Programming is the fun part, take time with it!

### 📺 **Presenter Display Tips**

- Use a **large screen (40"+ TV or projector)** - More exciting for spectators
- **Position screen** where all players can see
- **Stand near screen** - You can narrate battles and add excitement

### 👥 **Player Management Tips**

- **2-4 players** = Short, quick games (good for trying it out)
- **5-8 players** = Balanced gameplay, good for events
- **9-10 players** = More chaotic battles (bigger screen helps)
- **11+ players** = Run multiple simultaneous sessions with different hosts

### ⏱️ **Timing Tips**

- **Lobby to start** = 5 minutes (explain rules, answer questions)
- **Per round** = 2 minutes (1 min programming + 30 sec battle + 30 sec buffer)
- **Full 3-round game** = 10-15 minutes total (great for event/classroom timing)

---

## Troubleshooting

### ❌ **Players can't join the game**

- ✅ Check WiFi connection on players' devices
- ✅ Make sure they have the correct join link or QR code
- ✅ Ask them to refresh the page if stuck
- ✅ If they disconnected mid-match, ask them to rejoin with the same pilot name to reclaim their robot

### ❌ **Game is laggy or slow**

- ✅ Check WiFi signal strength
- ✅ Too many other devices using WiFi? Ask players to disconnect unnecessary devices
- ✅ Close extra browser tabs on host computer

### ❌ **A player's robot doesn't move as expected**

- ✅ They may not have programmed their moves correctly - review with them
- ✅ Robots can't move through walls/obstacles - check arena layout
- ✅ Check collision rules (two robots can't occupy same space)

### ❌ **Not sure what a game mechanic does?**

- ✅ Show help menu on presenter screen
- ✅ Read the "How to Play" guide (usually in the game info section)
- ✅ Check the Arena Rules section in this guide

---

## For Developers: Local Setup Alternative

If you prefer to run the game on your own server:

```bash
# Build for production
npm run build

# Deploy the built files to your hosting service
# The game will run in host mode by default
```

For technical questions, see `README.md` in the project root.

---

## Support & Questions

If players ask about:

- **"How do I move my robot?"** → They use the programming buttons (Move Forward, Rotate Left/Right, Shoot). Empty slots are allowed.
- **"I got disconnected - can I come back?"** → Yes. Rejoin with the same pilot name to reclaim your robot.
- **"What happens if two robots crash?"** → Both stay in place, neither moves
- **"Can I change my move?"** → No - programs must be submitted before execution phase
- **"How do I win?"** → Last robot standing wins! Eliminate all others by shooting

---

## Summary: Ready to Host?

1. ✅ Get the **join link** from the host console
2. ✅ Share QR code with players via screen or projector
3. ✅ Wait for 2-10 players to join
4. ✅ Press **"Start Match"**
5. ✅ Players program their robots (60 seconds)
6. ✅ Watch robots battle on presenter screen (30 seconds)
7. ✅ Repeat for 3 rounds
8. ✅ Celebrate the winner! 🏆

**Have fun hosting Code-A-Bot Arena!**
