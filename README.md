# Rugby LED Scoreboard (TB60, 560 × 80)

Two pages:

- **index.html**: the control panel. Open it on your phone, tablet or laptop.
- **display.html**: the screen page. Put its link in the TB60.

They talk to each other over the internet through 2 free public MQTT servers (HiveMQ and EMQX). The phone sends every change to both servers, and the TB60 listens to both, so it keeps working if one server is down. You don't need to set up any server or database.

## 1. Put the website online (one time, about 5 minutes)

**Option A: Netlify (easiest, free)**
1. Make a free account at https://app.netlify.com/signup.
2. Go to https://app.netlify.com/drop.
3. Drag the whole `rugby-scoreboard` folder (not the zip) onto the page.
4. You get a link like `https://something.netlify.app`. You can rename it in *Site configuration → Change site name*, e.g. `https://my-rugby-score.netlify.app`.

**Option B: GitHub Pages (free)**: make a public repo, upload the files, then turn on *Settings → Pages → Deploy from branch (main)*.

## 2. Open the control panel

Open `https://YOUR-SITE.netlify.app/` on your phone. A match code is created for you, e.g. `rugby-k3m9qa`. At the bottom, under **LED screen link (TB60)**, press **Copy link**. It looks like this:

```
https://YOUR-SITE.netlify.app/display.html?code=rugby-k3m9qa
```

Bookmark the control page. The code is saved in the address, so you always get the same match.

## 3. Put the link in the TB60 (ViPlex Express / ViPlex Handy)

1. Make a new program with screen size **560 × 80**.
2. Add a **Web page** media and paste the display link.
3. Make the window the full **560 × 80**, at position 0,0.
4. Turn off any automatic refresh. The page updates itself live.
5. Publish to the TB60.

The page scales itself to the window size, so it still fits if the window isn't exactly 560 × 80.

## Using it during a match

- **Clock**: Start / Pause (or press the space bar on a laptop), Reset, ±1 s, ±1 min, Set time (type `12:30` or `1230`).
- **Set 2nd half**: puts the clock on 40:00, paused, with the label "2ND HALF". Then press Start at kick-off.
- **Period label**: 1st half / Half time / 2nd half / Full time / Extra time / none.
- **Count up or count down**, and half length 40 / 35 / 30 / 20 / 7 (Sevens) / other.
  The clock turns **red** at 40:00 in the 1st half and 80:00 in the 2nd (or at 0:00 when counting down).
- **Scores**: +5 Try, +2 Conversion, +3 Penalty, +3 Drop goal, +1, −1. The score flashes on the LED when it goes up.
- **Undo last score**, **Reset scores**, **New match**. Buttons that erase things need two taps.
- **Flag**: upload a PNG or JPEG. It's resized automatically. With no flag, a block in the team colour is shown.
- **Team colour**: the thin stripe on the outer edge of the LED.
- **Full-screen message**: TRY!, HALF TIME, WELCOME or your own text. Long text scrolls.

## Good to know

- If the TB60 restarts or loses internet, it reloads the last score and clock by itself.
- The clock runs on the TB60 itself, so it keeps counting even if your phone goes to sleep.
- A tiny red dot in the bottom-right corner of the LED means the TB60 can't reach the servers.
- Anyone who knows your match code can change the score. Keep the random code, and don't share the control link.
- The free public servers have no uptime guarantee. For important events, test 30 minutes before kick-off.
- Keep team names short (about 12 letters or fewer) so they stay big on 80 px.
