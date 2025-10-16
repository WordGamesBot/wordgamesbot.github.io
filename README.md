# Wordle Bot
This is both a Wordle solver and a fully functional Wordle bot, based on the rules of [Wordle](https://www.nytimes.com/games/wordle/index.html) by Josh Wardle. You can either:

- Enter in your guess, and see what the next best guess would be based on the color of your tiles.
- Enter in a starting word, and run the Wordle bot to see the average score the bot would receive over 500 games, if it started with that word.

This bot has settings for normal, hard and ultra-hard mode (on ultra mode you are forced to use all previously given hints). The suggestions for future guesses can be entirely different across these settings, as they result in entirely different games.

# Wordbank
You have multiple choices for which wordbanks the wordlebot will consider as potential answers and guesses.
- 'Filtered NYT WordleBot Answers', based on the answer list of [NYT Wordle Bot](https://www.nytimes.com/interactive/2022/upshot/wordle-bot.html), but without regular past tense verbs.
- 'All NYT WordleBot Answers', the answer list of [NYT Wordle Bot](https://www.nytimes.com/interactive/2022/upshot/wordle-bot.html).
- 'NYT WordleBot Guesses', the guesses list of [NYT Wordle Bot](https://www.nytimes.com/interactive/2022/upshot/wordle-bot.html), mentioned in [their FAQ](https://www.nytimes.com/interactive/2024/02/16/upshot/wordlebot-faq.html#wordlists:~:text=them%20very%20obscure.-,4%2C500,-%3A%20The%20subset%20of).
- 'NYT Wordle Guesses', all words, that can be guessed in [Wordle](https://www.nytimes.com/games/wordle/index.html).
- 'Original Wordle Answers', original list of Wordle answers (2315 words).
- 'Most Likely Answers', based on the answerbanks from [Wordle](https://www.nytimes.com/games/wordle/index.html), [Quordle](https://www.quordle.com/#/), and [hellowordl](https://hellowordl.net/).
- 'All possible answers', includes all possible answers from Wordle Unlimited (no longer active).
- 'Old bot guesses', includes all possible guesses from [original bot](https://github.com/ybenhayun/wordlebot).

# Algorithm
The bot starts by looking at all possible guesses at any given stage. It compares those possible guesses to all words that it thinks could be the answer, and groups them into buckets based on the colors you would see, for that specific guess and that specific answer. For example:

    Guess word: AROSE
    ----------------------
    Potential Answer: ABACK
    Colors: GBBBB (the 'A' in AROSE is correct, nothing else is).
    ----------------------
    Potential Answer: BEARD
    Colors: YYBBY ('A', 'R', and 'E' are all in the word, but in different places).
    ----------------------
    Potential Answer: ALARM
    Colors: GBBBB (notice this is the same pattern as ABACK).

So in this example, the bucket GBBBB would be size 2, and the bucket YYBBY, would be size one.
After going through all the potential answers, and calculating all the expected differences, the bot:

- takes a weighted average of the size of each bucket (in the above example it would be 1.67)
- determines the approximate likelihood you should expect to land on the answer by the next guess. If you saw YYBBY, there is a 100% chance as there's only one word left, if you saw GBBBB you would have a 50% chance of guesses the correct word on the next guesses, as you'd still have two possibilities. This averages to 66.67% chance of ending the game on the next guess.
- Calculates a rough 'adjusted score' to sort by, by letting 
    
    adjusted = (1 - 'odds game ends on the next turn')*'average size of each bucket'

From there, the bot takes the top words from that metric, and maps out how each of those words would get to *every possible answer* recursively. As in, if you were considering DRONE as a second guess after SALET:

    SALET --> DRONE --> REIGN (3 guesses to get to REIGN)
    SALET --> DRONE (2 guesses to get to DRONE)
    SALET --> DRONE --> URINE --> BRINE (4 guesses to get to BRINE)
    SALET --> DRONE --> MURRY --> BERRY --> FERRY (5 guesses to get to FERRY)

The word that takes the lowest number of guesses (on average) to get to every answer, is the best possible guess at that point.
Note-- the first metric is only used to sort the list of possible guesses.

# Results
For 'Filtered NYT WordleBot Answers' answer list I manually added solve paths for best guesses and for some of the most common first guesses (according to data from [NYT Wordle Bot](https://www.nytimes.com/interactive/2022/upshot/wordle-bot.html)). These results were calculated by [this program](https://github.com/alex1770/wordle).

# Reliability
For its suggestions bot shows average number of guesses required to solve every answer, that is still possible at a given situation. To calculate it, bot explores every word by picking top 'adjusted score' word for its next guesses, until it reaches every answer. But if there are a lot of possible guesses left, it might not be optimal. For example, on ultra-hard mode after ADIEU with only green E (colored as BBBGB), bot will not find any winning path on its own, but since ADIEU is a common first guess, its solve path is built-in, so it will show, that METEL is winning. (This bots thinks that METEL loses on POWER, BOXER and POKER (all of which are in BBBGB bucket), but after you color METEL as BBBGB and calculate its next best guess, it will find two words, that can win on all answers). On easy mode its usually fine, although it will not find any winning follow up after all gray MEZZO with 5 guesses left, while SLATE can solve every possible answer on easy mode in 5 guesses.

# Site
You can play around with the bot yourself [here](link to new bot)

# Credits
[ybenhayun](https://github.com/ybenhayun) - [Original bot](https://ybenhayun.github.io/wordlebot/) author

[Alex Selby](https://github.com/alex1770) - [Score calculator](https://github.com/alex1770/wordle) author 

[Ryan4598](https://github.com/Ryan4598) - [Polygonle implementation](https://github.com/ybenhayun/wordlebot/pull/8) 

[Brian Xu](https://github.com/brian-xu) - [Idea to show score of last guess on the board](https://github.com/ybenhayun/wordlebot/commit/12d15461239dab0eeca73965481b5e5146f75b15) 

[Qianlang Chen](https://github.com/the-chenergy) - [Idea to use URL parameters](https://github.com/the-chenergy/wordlebot/tree/co-wordle-lists) 

[Rangsk](https://linktr.ee/rangsk) - [Known answer field implementation](https://github.com/dclamage/wordlebot/tree/autocolor), inspiration and testing 
