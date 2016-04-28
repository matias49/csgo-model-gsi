var request = require('request');

/**
 * The primary object of the CSGO data
 * @param {JSON} body All the CSGO data (req.body)
 */
function CsgoData(body, _steamApiKey) {
  if (_steamApiKey !== undefined) {
    this.steamApiKey = _steamApiKey;
  }
  this.provider = Provider(body.provider);
  // Game can be on 'menu' activity or 'warmup' phase. On these cases there is no Map or Round data.
  if (body.hasOwnProperty('map')) {
    this.map = Map(body.map);
    this.team = {};
    this.team.ct = Team(body.map.team_ct, 'CT', 'CT');
    this.team.t = Team(body.map.team_t, 'T', 'T');
  }
  if (body.hasOwnProperty('round')) {
    this.round = Round(body.round);
  }
  if (body.hasOwnProperty('player')) {
    this.screenPlayer = Player(body.player);
  }
  // We store all the players on an array
  if (body.hasOwnProperty('allplayers')) {
    this.players = [];
    for (var key in body.allplayers) {
      this.players.push(Player(body.allplayers[key], key));
    }
  }
  if (body.hasOwnProperty('auth')) {
    this.auth = Auth(body.auth);
  }
}

/**
 * Provider data on the CSGO data
 * @param {JSON} provider The provider data
 */
function Provider(provider) {
  var data = new Object();
  data.name = provider.name;
  data.appid = provider.appid;
  data.version = provider.version;
  data.steamid = provider.steamid;
  data.timestamp = provider.timestamp;
  return data;
}

/**
 * Map data on the CSGO data
 * @param {JSON} map The map data
 */
function Map(map) {
  var data = new Object();
  data.mode = map.mode;
  data.name = map.name;
  data.phase = map.phase;
  data.round = map.round + 1;
  return data;
}

/**
 * Round data on the CSGO data
 * @param {JSON} round The round data
 */
function Round(round) {
  var data = new Object();
  data.phase = round.phase;
  data.bomb = round.bomb || '';
  data.winTeam = round.win_team || '';
  return data;
}

/**
 * Player data on the CSGO data
 * @param {JSON} player  The player data
 * @param {string} steamid The steamID of the player, which isn't include on the player JSON if the data come from the allplayers, but it's it key
 */
function Player(player, steamid) {
  var data = new Object();
  data.steamid = player.steamid || steamid;
  data.name = player.name;
  // Team can be 'undefined' if we're on the free view
  data.team = player.team || 'SPEC';
  if (player.hasOwnProperty('activity')) {
    data.activity = player.activity;
  }
  // We flat the state data if its set (only on game)
  if (player.hasOwnProperty('state')) {
    data.health = player.state.health;
    data.armor = player.state.armor;
    data.helmet = player.state.helmet;
    data.flashed = player.state.flashed;
    data.burning = player.state.burning;
    data.money = player.state.money;
    data.roundKills = player.state.round_kills;
    data.roundKillsHS = player.state.round_killhs;
  }
  if (player.hasOwnProperty('weapons')) {
    data.weapons = [];
    for (var key in player.weapons) {
      var weapon = {};
      weapon.name = getWeaponName(player.weapons[key].name);
      weapon.state = player.weapons[key].state;
      weapon.type = player.weapons[key].type;
      weapon.class = getWeaponClass(player.weapons[key].type);
      if (player.weapons[key].hasOwnProperty('ammo_clip_max')) {
        weapon.ammo = player.weapons[key].ammo_clip;
        weapon.ammoMax = player.weapons[key].ammo_clip_max;
        weapon.ammoreserve = player.weapons[key].ammo_reserve;
      }
      data.weapons.push(weapon);
    }
  }
  if (player.hasOwnProperty('match_stats')) {
    data.kills = player.match_stats.kills;
    data.assists = player.match_stats.assists;
    data.deaths = player.match_stats.deaths;
    data.mvps = player.match_stats.mvps;
    data.score = player.match_stats.score;
  }
  return data;
}

/**
 * Team data on the CSGO data
 * @param {JSON} team        The team data
 * @param {string} side        The side of the team
 * @param {string} defaultName The clan name of the team, the default name of the team (define above) otherwise
 */
function Team(team, side, defaultName) {
  var data = new Object();
  data.score = team.score;
  data.side = side;
  data.name = team.name || defaultName;
  data.flag = team.flag || '';
  return data;
}

/**
 * Auth data on the CSGO data
 * @param {JSON} auth The Auth data
 */
function Auth(auth) {
  var data = new Object();
  data.token = auth.token;
  return data;
}

/**
 * Get only the weapon name (without the "weapon_" prefix)
 * @param  {string} name The original weapon name from the game
 * @return {string}      The weapon name without the game prefix ("weapon_")
 */
function getWeaponName(name) {
  return name.match(/(weapon_)(.*)/)[2];
}

/**
 * Get the weapon class by their category
 * @param  {string} type The category of the weapon
 * @return {string}      The weapon class
 */
function getWeaponClass(category) {
  switch (category) {
    case 'Pistol':
      return 'secondary';
      break;
    case 'Shotgun':
    case 'Submachine Gun':
    case 'Rifle':
    case 'SniperRifle':
    case 'Machine Gun':
      return 'primary';
      break;
    case 'Knife':
      return 'knife';
      break;
    case 'Grenade':
      return 'grenade';
      break;
    default:

  }
}

// FUNCTIONS

/**
 * Sorting all the players array by their team
 */
CsgoData.prototype.sortPlayersByTeam = function () {
  this.players.sort(function (a, b) {
    return a.team.localeCompare(b.team);
  });
};

/**
 * Sort the player list by their steam id
 * @return {array} The player list ordered by their steamID
 */
CsgoData.prototype.sortPlayersBySteamId = function () {
  this.players.sort(function (a, b) {
    return a.steamid.localeCompare(b.steamid);
  });
};

/**
 * Check if the round status changed
 * @param  {JSON} oldData The n-1 data the server sent
 * @return {boolean}         True if the round status changed, false otherwise
 */
CsgoData.prototype.isStatusChanged = function (oldData) {
  return this.round.phase !== oldData.round.phase;
};

/**
 * Check if the status of the bomb changed
 * It can be this values :
 * - undefined
 * - planted
 * He doen't have a 'exploded' value
 * @param  {JSON} oldData The n-1 data the server sent
 * @return {boolean}         True if the status between n and n-1 data changed
 */
CsgoData.prototype.isBombStatusChanged = function (oldData) {
  return this.round.bomb !== oldData.round.bomb;
};

/**
 * DEBUG function
 * It prints on the console the two teams, which one is winning and the score
 * @return {string} The string which will be printed
 */
CsgoData.prototype.logWinningTeam = function () {
  if (this.team.t.score > this.team.ct.score) {
    return this.team.t.name + " is winning against " + this.team.ct.name + " " + this.team.t.score + "-" + this.team.ct.score;
  } else if (this.team.t.score === this.team.ct.score) {
    return "Game is tied between " + this.team.t.name + " and " + this.team.ct.name + " " + this.team.t.score + "-" + this.team.ct.score;
  } else {
    return this.team.ct.name + " is winning against " + this.team.t.name + " " + this.team.ct.score + "-" + this.team.t.score;
  }
};

/**
 * Get the Team name who won the round
 * @return {string} The team name
 */
CsgoData.prototype.getWinnerTeamName = function () {
  if (this.round.winTeam === 'CT') {
    return this.team.ct.name;
  } else {
    return this.team.t.name;
  }
};

/**
 * Get the Team side who won the round
 * @return {string} The team side
 */
CsgoData.prototype.getWinnerTeamSide = function () {
  if (this.round.winTeam === 'CT') {
    return this.team.ct.side;
  } else {
    return this.team.t.side;
  }
};

/**
 * Get the list of counter-terrorist players
 * @return {array} The counter-terrorist players
 */
CsgoData.prototype.getCTPlayers = function () {
  return this.players.filter(function (items) {
    return items.team == 'CT';
  });
};

/**
 * Get the list of terrorist players
 * @return {array} The terrorist players
 */
CsgoData.prototype.getTPlayers = function () {
  return this.players.filter(function (items) {
    return items.team == 'T';
  });
};
/**
 * Check if the game is on warmup phase
 * @return {Boolean} true if the game is on warmup phase, false otherwise
 */
CsgoData.prototype.isWarmup = function () {
  return this.map.phase === 'warmup';
};

/**
 * Check if the player is alive
 * @param  {JSON}  player The player data
 * @return {Boolean}        true if the player is alive (health > 0), false otherwise
 */
CsgoData.prototype.isAlive = function (player) {
  return player.health > 0;
};

/**
 * Get the number of the players alive on a team
 * @param  {string} teamSide The team side we want to get the players alive
 * @return {int}          The number of players who are alive on the team specified
 */
CsgoData.prototype.getTeamPlayersAlive = function (teamSide) {
  var number = 0;
  for (var key in this.players) {
    if (this.players[key].team == teamSide && this.isAlive(this.players[key])) {
      number++;
    }
  }
  return number;
};

/**
 * Check if the players between the n and n-1 data changed
 * @param  {JSON} oldData The n-1 data
 * @return {boolean}         True if a player changed or is missing, false otherwise
 */
CsgoData.prototype.IsPlayersChanged = function (oldData) {
  for (var key in oldData.players) {
    if (this.players[key] === undefined) {
      return true;
    }
  }
  for (var key in this.players) {
    if (oldData.players[key] === undefined) {
      return true;
    }
  }
  return false;
};

/**
 * Check if the screen player is the provider of the data (same SteamID)
 * @return {boolean}         True if a player changed or is missing, false otherwise
 */
CsgoData.prototype.IsScreenPlayerProvider = function () {
  if (this.provider.steamid === this.screenPlayer.steamid) {
    return true;
  }
  return false;
};

/**
 * Check if the player is actually playing a game
 * @return {boolean} True if the player is playing, false otherwise
 */
CsgoData.prototype.IsPlaying = function () {
  if (this.screenPlayer.activity === "playing") {
    return true;
  }
  return false;
};

/**
 * Get the players images by the steam api
 * We call the steam API only if the pictures were never get.
 * We use a promise here to be async
 * We have to pass the new data as parameter, since "this" can't be called inside a native Promise
 * @param  {JSON} newData The n data of the game
 * @param  {JSON}} oldData The n-1 data of the game
 * @return {JSON}         All the n data plus the pictures of the players
 */
CsgoData.prototype.getPlayerImages = function (newData, oldData) {
  return new Promise(function (fulfill, reject) {
    // By default, we think we don't have to call the Steam API beceause we already have them on the n-1 data
    var getImages = false;
    
    // So first we check we still have the same 10 players
    if (!newData.IsPlayersChanged(oldData)) {
      console.log('Players didnt change');
      // And these 10 players have a picture
      for (var player in oldData.players) {
        if (oldData.players[player].image === undefined) {
          console.log('A player doesnt have a picture.');
          getImages = true;
        }
      }
    } else {
      getImages = true;
    }
    // We don't have all the pictures, so we'll call the Steam API
    // If only a single player changed, we still call the pictures of the 10 players, beceause we will always use one call.
    if (getImages) {
      console.log('Get Images');
      // We get all the players steamID to join them on the URL
      var playersId = [];
      var playersIdString;
      for (var player in newData.players) {
        playersId.push(newData.players[player].steamid);
        playersIdString = playersId.join(',');
      }
      // We call the API via request
      // Default request template
      console.log('callAPI');
      request('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=' + newData.steamApiKey + '&steamids=' + playersIdString + '&format=json', function (error, response, body) {
        var steamResponse = JSON.parse(body);
        //Check for error
        if (error) {
          return console.log('Error:', error);
        }
        //Check for right status code
        if (response.statusCode !== 200) {
          return console.log('Invalid Status Code Returned:', response.statusCode);
        }
        // No error, we navigate through the response to get the pictures and save them to the right player
        for (var i = 0; i < steamResponse.response.players.length; i++) {
          steamid = steamResponse.response.players[i].steamid;
          for (var player in newData.players) {
            if (newData.players[player].steamid === steamid) {
              newData.players[player].image = steamResponse.response.players[i].avatarmedium;
              // Player found for the picture, no need to continue here
              continue;
            }
          }
        }
        fulfill(newData);
      });
    } else {
      // We didn't call the API. We get the pictures from the n-1 data
      console.log('no need to call. We pick the last pictures.');
      for (var player in newData.players) {
        if (newData.players[player].steamid === oldData.players[player].steamid) {
          newData.players[player].image = oldData.players[player].image;
          continue;
        };
      }
      fulfill(newData);
    }
  });
};
/**
 * Like the getPlayerImages function above, but just for the screen player.
 * Used on the client application.
 * @param  {JSON} newData The n data of the game
 * @param  {JSON}} oldData The n-1 data of the game
 * @return {JSON}         All the n data plus the pictures of the players
 */
CsgoData.prototype.getScreenPlayerImage = function (newData, oldData) {
  console.log('CALLPLAYER');
  return new Promise(function (fulfill, reject) {
    // By default, we think we don't have to call the Steam API beceause we already have them on the n-1 data
    var getImages = false;
    console.log(oldData.screenPlayer.steamid);
    if (newData.screenPlayer.steamid === oldData.screenPlayer.steamid) {
      console.log('Player didnt change');
      if (oldData.screenPlayer.image === undefined) {
        console.log('The player doesnt have a picture.');
        getImages = true;
      }
    } else {
      getImages = true;
    }
    if (getImages) {
      console.log('Get Image');
      var playerId = newData.screenPlayer.steamid;
      // We call the API via request
      // Default request template
      console.log('callAPI');
      request('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=' + newData.steamApiKey + '&steamids=' + playerId + '&format=json', function (error, response, body) {
        var steamResponse = JSON.parse(body);
        //Check for error
        if (error) {
          return console.log('Error:', error);
        }
        //Check for right status code
        if (response.statusCode !== 200) {
          return console.log('Invalid Status Code Returned:', response.statusCode);
        }
        // No error, we navigate through the response to get the pictures and save them to the right player
        console.log('OK !');
        newData.screenPlayer.image = steamResponse.response.players[0].avatarmedium;
        fulfill(newData);
      });
    } else {
      // We didn't call the API. We get the pictures from the n-1 data
      console.log('no need to call. We pick the last pictures.');
      newData.screenPlayer.image = oldData.screenPlayer.image;
      fulfill(newData);
    }
  });
};
module.exports = CsgoData;
