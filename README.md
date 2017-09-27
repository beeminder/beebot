## Beebot

##### A helpful bot for interacting with Beeminder

This is the source for Beebot, a Slack bot that allows you to interact with Beeminder.

You can [install](https://www.beeminder.com/addtoslack) Beebot on your Slack team to test it out. You'll need a Beeminder account before you do.

### @beebot and /bee

The core Beebot commands are listed here. They can be invoked by users either with the slash command `/bee` or by @-mentioning @beebot in a channel (everything apart from the @-mention is interpreted as the command, i.e., "@beebot list", "list @beebot", and "/bee list" will all invoke the `list` command).

`list` will display your five most urgent goals (nearest deadlines).

`list N` will display your N most urgent goals (nearest deadlines).

`goalname` will display the status and graph for the goal with that goalname

`goalname date value "comment"` will add a datapoint to the goal with that goalname

`goalname++` is a shortcut for adding a datapoint of "1" for today for the goal with that goalname

`goalname--` is a shortcut for adding a datapoint of "-1" for today for the goal with that goalname

### Other slash commands

Installing Beebot also installs a number of related and not-so-related slash commands. 
Each command is handled by code in a file of the same name, and contains help text on how it works.

##### /bid

Sets up a sealed-bid auction with the mentioned participants. Participants submit their bids via the `/bid` command. Once all bids have been collected, the bids are revealed.

##### /tock

Announces to the channel that you're beginning a pomodoro session (45-minute pomodoros are traditionally, in Beeminderland, known as tocks) and what you plan to get done during it. You can then abort or finish the tock. Change the length from the default 45 minutes with `/tock length N`.

##### /roll

Rolls a die. Specifically `/roll N` rolls an N-sided die.

##### /charge

Charges you the specified amount via the [Beeminder API](https://www.beeminder.com/api), or schedules the amount to be charged in the specified time unless canceled.

For example, you could say `/charge 5 in 30 unless I send this email`. Then if you send the email in time you can say `/charge cancel` to cancel it, or if you don't, just let the charge go through. 

##### /karma

Turns karma scores on or off for your team. If karma is on, Beebot will listen for any text like `foo++` or `bar--` and update the karma score appropriately. `/karma list` shows all karma scores; `/karma list N` shows the top N scores. 

##### /tagtime

Turns on or off TagTime notifications as direct messages. No way to respond to them, just if you want another way to be notified of pings.

##### /bet

We haven't actually implemented this one yet but it might be cool!
It's like predictionbook.com where you can log predictions like 
`/bet such-and-such happens p=.3 #foo`
and then, I don't know, some other syntax for resolving them, keeping track of your calibration, reminding you to resolve them...
Ok, this could be a whole startup's worth of work, but someone should totally do it!


### Contributing

Make a branch off of master and send a pull request!
