//MAV_Maze_Rescue PlayFab CloudScripts. 

//Cloud script that generates Maze Configuration
handlers.GetMazeConfig = function (args) {
    var titleDataResult = server.GetTitleData({});

    var data = titleDataResult.Data["Animal"];
    var jsonObject = JSON.parse(data);

    var size = 0;
    for (var key of Object.keys(jsonObject)) {
        size + 1;
    }


    var playerDataResult = server.GetPlayerStatistics({ PlayFabId: currentPlayerId });
    var playerObject = JSON.parse(playerDataResult.Statistics["Level"]);
}