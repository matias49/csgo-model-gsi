csgo-model-gsi
========

A node module providing an easy way to reformat the data from the [Game State Integration API](https://developer.valvesoftware.com/wiki/Counter-Strike:_Global_Offensive_Game_State_Integration) of CSGO.
Also providing functions to manage the data.

## Used by
* Csgo Web Specator panel - A free and customizable view for spectators (Soon on GitHub)
* Csgo Client panel - A free Electron application giving information about the game you're playing (Soon on GitHub)

## Requirements
* Requests (used to call the Steam API to get player images)
* A configuration file to enable GSI

## Usage

**The constructor waits for two parameters :**
* The raw body data sent from the GSI API
* (optional) Your Steam API key which can be found here : http://steamcommunity.com/dev/apikey

**To use comparaison functions, it's advisable to store the last data on another variable**

### Example :

```javascript
var csgoModel = require('csgo-gsi-model');
router.post('/', function(req, res) {
    csgo = new csgoModel(req.body, 'STEAM_API_KEY');
    // The data is set up
    // All the behaviour here

    // At the end, we store the data on another variable to use it for comparaison
    oldCsgo = csgo;
}
```

### Functions available
#### Usage 
```javascript
csgo.functionName
```
`sortPlayersByTeam()` - Used to sort the players by their team.

`sortPlayersBySteamId()` - Used to sort the players by their Steam ID.

`isStatusChanged(oldCsgoData)` - Used to check if the round status changed between the two data.

`isBombStatusChanged(oldCsgoData)` - Used to check if the bomb status changed between the two data.

`getWinnerTeamName()` - Used to get the winning team name of a round.

`getWinnerTeamSide()` - Used to get the winning team side of a round.

`getCTPlayers()` - Used to get the CT players.

`getTPlayers()` - Used to get the T players.

`isWarmup()` - Used to check if the round is the warmup round.

`isAlive(player)` - Used to check if the player given is alive (check if his health > 0).

`getTeamPlayersAlive(teamSide)` - Used to get the number of alive players on the side given.

**teamSide : 'T' or 'CT'**

`IsPlayersChanged(oldCsgoData)` - Used to check if the players are still the same between the two data.

`IsScreenPlayerProvider()` - Used to check if the player is also the provider of the data (check by the Steam ID)

`IsPlaying()` - Used to check if the player is playing the game (= on a server)

`getPlayerImages(newCsgoData, oldCsgoData)`
A big one... This one calls the Steam API to get the player images.
It needs both old and new data to check if it's useful to call the API (the images aren't on the old data) and also to access everything on the Promise.

`getScreenPlayerImage(newCsgoData, oldCsgoData)`
Same as above, but for the player at the screen. Used for the Electron app.


#### Changelog

V 0.5.0 : First public release on NPM

V 0.5.1 : Fixed the Steam API call

V 0.5.2 : Updated on Github & 1st README

#### Licence

MIT