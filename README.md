# Yet Another Metronome (YAM)

- [Available on F-Droid!](https://f-droid.org/packages/com.degeder.yam/)

Yet Another Metronome (YAM) is a simplistic metronome app I built as an amateur musician looking for a free, ad-free, and powerful alternative.
Most apps I tried had a BPM (beats per minute) limit around 200, which felt too restrictive. I wanted something much faster, so I built it myself.

This app was created using [Capacitor.js](https://capacitorjs.com/), allowing me to deliver a cross-platform experience without diving into
native development. Building the whole project took just a week, but I believe learning native mobile development from scratch would’ve taken at least a month.

The app icon and splash screen are based on [this metronome icon](https://www.svgrepo.com/svg/517774/metronome).
Used [this effect for tock.mp3](https://freesound.org/people/gherat/sounds/139653) and [this effect for tick.mp3](https://freesound.org/people/Entershift/sounds/704134/).

## App Features:

- Simple and clean interface
- Light and dark mode support with a quick toggle
- High BPM support (up to 600) beyond typical app limits
- High beat number support (up to 20)
- Completely free and open-source (GPLv3 License)
- Free and most importantly, no ads

## Building:

1. Install [Android Studio](https://developer.android.com/studio).
2. Install [node.js](https://nodejs.org/en/download) for your OS.
3. Install required packages by running `npm install`.
4. Run `npm run build` and then `npx cap sync` to sync android part of the project.
5. Open Android Studio by running `npx cap open android`.
6. In Android Studio, select _Build_ > _Generate App Bundles or APKs_ > _Generate APKs_.
7. You can find freshly built APKs at `android\app\build\outputs\apk\debug`.

## App Images:

<img width="360" alt="light mode image" src="https://github.com/user-attachments/assets/e4d735c4-d683-49cb-95c7-fe6075edab5e" />
<img width="360" alt="dark mode image" src="https://github.com/user-attachments/assets/be52617d-9f91-467f-b330-5bbe045ccd5b" />
