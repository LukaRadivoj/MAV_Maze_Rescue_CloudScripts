//MAV_Maze_Rescue PlayFab CloudScripts. 
//Cloud script that generates Maze Configuration
handlers.GetMazeConfig = function (args) {
    var request = {
        PlayFabId: currentPlayerId
    };
    // The pre-defined "server" object has functions corresponding to each PlayFab server API 
    // (https://api.playfab.com/Documentation/Server). It is automatically 
    // authenticated as your title and handles all communication with 
    // the PlayFab API, so you don't have to write extra code to issue HTTP requests. 
    var playerStatResult = server.GetPlayerStatistics(request);
    var playerStatObject = JSON.parse(playerStatResult.Statistics["Level"]);
    return { Level: "level" };
    /*
    //Choosing Rarity
    var rarity;
    var randomNumber = getRandomInt((playerLevel * 2) + 1);
    if (randomNumber <= 50) {
        rarity = "Common";
    }
    else if (randomNumber > 50 && randomNumber <= 80) {
        rarity = "Uncommon";
    }
    else if (randomNumber > 80 && randomNumber <= 95) {
        rarity = "Rare";
    }
    else if (randomNumber > 95 && randomNumber <= 99) {
        rarity = "SuperRare";
    }
    else {
        rarity = "UltraRare";
    }

    
    //Choosing Animal From Rarity
    var titleDataResult = server.GetTitleData({});

    var data = titleDataResult.Data["Animal"];
    var animals = JSON.parse(data);

    let animalsOfRarity: Array<string>;
    let animalVariance: Array<Number>;
    let varianceSum: number = 0;

    for (var key in Object.keys(animals)) {
        if (key['animalRarity'] == rarity) {
            animalsOfRarity.push(key);
            varianceSum += Number(key['varianceInRarityGroup']);
            animalVariance.push(varianceSum)
        }
    }

    randomNumber = Math.random() * varianceSum;
    var selectedAnimalId;
    let selectedAnimalVariance : number;
    for (let i = 0; i < animalsOfRarity.length; i++) {
        if (randomNumber <= animalVariance[i]) {
            selectedAnimalId = animalsOfRarity[i];
            selectedAnimalVariance = Number(data[selectedAnimalId]['varianceInRarityGroup']) / varianceSum;
        }
    }
    
    var selectedAnimal = data[selectedAnimalId];

    var result = {
        "AnimalId":selectedAnimalId,
        "AnimalVariance":selectedAnimalVariance
    }
    
    var result = {
        "PlayerLevel": playerLevel
    };
    return result;
    */
};
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
