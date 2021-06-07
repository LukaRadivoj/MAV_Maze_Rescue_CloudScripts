//MAV_Maze_Rescue PlayFab CloudScripts. 
//Cloud script that generates Maze Configuration
handlers.GetMazeConfig = function (args) {
    var playerDataResult = server.GetPlayerStatistics({ PlayFabId: currentPlayerId });
    var playerLevel = JSON.parse(playerDataResult.Statistics["Level"]);
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
    var animalsOfRarity;
    var animalVariance;
    var varianceSum = 0;
    for (var key in Object.keys(animals)) {
        if (key['animalRarity'] == rarity) {
            animalsOfRarity.push(key);
            varianceSum += Number(key['varianceInRarityGroup']);
            animalVariance.push(varianceSum);
        }
    }
    randomNumber = Math.random() * varianceSum;
    var selectedAnimalId;
    var selectedAnimalVariance;
    for (var i = 0; i < animalsOfRarity.length; i++) {
        if (randomNumber <= animalVariance[i]) {
            selectedAnimalId = animalsOfRarity[i];
            selectedAnimalVariance = Number(data[selectedAnimalId]['varianceInRarityGroup']) / varianceSum;
        }
    }
    var selectedAnimal = data[selectedAnimalId];
    var result = {
        "AnimalId": selectedAnimalId,
        "AnimalVariance": selectedAnimalVariance
    };
    return result;
};
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
