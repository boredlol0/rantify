## Inspiration
Most social platforms aren’t built for raw, real, emotional expression. That’s where Rantify comes in. Inspired by the idea of turning unfiltered emotion into meaningful reflection, I wanted to build a space where people could speak their minds without judgment, anonymously or not, and still feel heard.

## What it does
* Tap a mic and record a rant
* See it live-transcribed into text
* Choose whether to post it publicly for others to see or privately so you can keep a personal journal of your rants
* Have the choice to post a rant anonymously
* Browse rants from others, like, comment, or even reply to comments
* View your own rants in a personal dashboard

## How we built it
* At the core, Rantify is built on [Next.js](https://nextjs.org/) + [shadcn/ui](https://ui.shadcn.com/) for the frontend
* For user authorization and storage of rants's audio files, Supabase Auth and Supabase object storage were used respectively
* For live speech-to-text, Speech API was used
* ElevenLabs TTS paired with Supabase Edge Functions to deliver TTS to allow users to listen to rants
* Deployed to Netlify
* Built entirely with [Bolt.new](https://bolt.new/)

## Challenges we ran into
* Getting Supabase Auth to work properly since for some reason, whenever the the `output` property was not set to `export` in the `next.config.js`, Supabase Auth outright did not work on bolt, but worked on my local machine.
* Due to that I was forced to set `output: export` in `next.config.js` thus, alot of features were not supported or did not work such as dynamic routes (`/rant/[rantId]`), I had to instead used query parameters (`/rant?id=[rantId]`) which does not look as clean
* Setting `output: export` also meant dynamic API routes did not work, so I had to resort to use Supabase Edge Functions for TTS of Rants
* Bolt also used outdated packages which works for not but is not future proof as they are emit warnings and may stop working in the future
* Even though there is a built-in Supabase integration in Bolt, it does not support Next.js project although Supabase have extensive documentation on it

## Accomplishments that we're proud of
* Entirely built and works on Bolt
* Designed a sleek, responsive UI that works great on both desktop and mobile

## What we learned
* Working with audio can be particularly difficult at times
* How to use Bolt.new to rapidly scaffold and deploy a real-world app

## What's next for Rantify
As of now, Rantify has numerous limitations as well as numerous new features that can make the experience a lot better.

### Limitations
* Although it is not a concern now or won't be unless the app skyrockets, the username generation is limited to 63,935,936 unique usernames
* Libraries used such as for Supabase are outdated and should be upgraded to use the new libraries
* No moderation, which can result in unwanted content

### Future Features
* Could add AI-powered mood detection or sentiment tagging
* Let users respond with voice (not just text) for more natural interactions
* Monetization via RevenueCat for a “Rant+” experience: extended rant time (currently limited to 3 minutes), insights, and emotional analytics


#### How to run it on Bolt
* For some reason, atleast for me, the original bolt.new project is just stuck on sync repository so to get to work, you need to run `npm install && npm next dev` meanual then everything should work fine
* It also uses expects a `.env` or a `.env.local` file with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set to its values respectively
* The TTS function uses a supabase edge function which if you have not set up, it'll just say unavaiable in the UI
