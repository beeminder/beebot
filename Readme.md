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

Installing Beebot also installs a number of slash commands. Each command is handled by code in a file of the same name, and contains help text on how it works.

##### /bid

Sets up a sealed-bid auction with the mentioned participants. Participants submit their bid via the `/bid` command. Once all bids have been collected, the bids are revealed.

##### /tock

Announces to the channel that you're beginning a pomodoro session and the topic of that session. You can then abort or finish the tock. The default tock length is 45 minutes, but this can be changed with `/tock length N`.

##### /roll

`/roll N` rolls an N-sided die and returns the result.

### Contributing

Make a branch off of master and send a pull request!
