# K-Pop Girl Group Heardle

Remixed and extended from the original K-Pop GG Heardle (which ran out of songs).

This is a spin-off of the original [Heardle](https://www.heardle.app/) but for K-Pop Girl Group songs. Each song is randomly chosen from soundclud. I do not own any rights to the songs used in this game. All copyright goes to the relevant parties.

The code for this project is remixed from the [ZAYN Heardle](https://zayn-heardle.glitch.me/) (by [@eggtartemily](https://twitter.com/eggtartemily)) and [Taylor Swift Heardle](https://taylor-swift-heardle.glitch.me/) projects.

If you have any questions, you can contact me at [alw.lol](https://alw.lol). This project was updated at the request of Dilara.

### How to create your own custom Heardle

1. Create a Glitch account.
2. Remix this project (or another existing custom Heardle project on Glitch) and rename the project to what you want the game link to be (e.g. artist-heardle).
3. In the `index.html` file, change every instance of 'K-Pop Girl Group' to your artist. You can find and replace by hitting command+option+F on Mac (I don't know what the shortcut is on Windows).
4. In the `index.html` file, there is a long link to a photo. Replace every instance of this link with a URL to a photo of your choice.
5. In the `index.html` file, **remove the Google Analytics tag** at the bottom. You can replace it with your own if you want to track your site usage ([instructions here](https://support.google.com/analytics/answer/9306384?hl=en)) but it's optional.
6. Songs and answers are defined in the `songs.js` file. The songs should go in the order you want the game to go. You can manually enter the songs or if you know how to, you can write a separate script to randomize the tracks and then just copy and paste. **Note: These tracks have to follow the format `Artist - Track Title` for it to display correctly in the SoundCloud widget.**
7. In the `main.js` file, search for every instance of 'K-Pop Girl Group'. These will include the text for the info tab, support tab, game link, game messages, etc. Replace these with your artist and customize the text to your liking. **Important:** Change the game link in the clipboard copy to your custom Heardle link. If you forget, users who copy their results will copy the link to this Heardle instead. Search "kpopgg-heardle-round2.glitch.me" if you can't find the line of code.
8. In the `main.js` file, find where `const Vt` is defined. Below that, there will be a list of game messages that will show depending on how many tries the user guesses the song in. Customize these to your liking.
9. Also in this section is the variable `startDate`. Theoretically, you would change this to the current date so that the game starts with the first track you listed. However, I noticed that if you do this, it will mess up the SoundCloud player, so I ended up entering a date like a week earlier which was the latest date I could use without messing up the player. It's weird. It seems like a bug in the original Heardle code as well, but I don't know JavaScript well enough to know how to fix this bug. If you do, DM me.

Now you're done with all the necessary changes. Congrats! Read on for optional edits.

1. In the `bundle.css` file, go to line 788. Here you can change the different accent colors for your game. Simply replace the HEX color codes with ones you want.
2. You are currently reading the `README.md` file. Once you no longer need this, you can delete all this text and write whatever information you want to include about this project.
3. Lastly, share your custom Heardle!
