//MAV_Maze_Rescue PlayFab CloudScripts. 

//Cloud script that generates Maze Configuration
handlers.GetMazeConfig = function (args) {

    var levelResult = server.GetPlayerStatistics({ PlayFabId: currentPlayerId });
    let playerLevel: number = levelResult.Statistics[0].Value;

    //Choosing Rarity
    var rarity;
    var randomNumber = Math.floor(Math.random() * ((playerLevel * 2) + 1));
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
    var titleDataResult = server.GetTitleData({ "Keys": ["Animals"] });
    var animals = titleDataResult.Data.Animals;
    var animalsObj = JSON.parse(animals);

    let animalsOfRarity: Array<string> = new Array();
    let animalVariance: Array<number> = new Array();
    let varianceSum: number = 0;


    for (var key of Object.keys(animalsObj)) {
        var currentAnimal = animalsObj[key];

        if (currentAnimal['animalRarity'] == rarity) {
            var variance = (currentAnimal['varianceInRarityGroup']);
            let varianceNum: number = +(variance);
            varianceSum += varianceNum;

            animalVariance.push(varianceSum)
            animalsOfRarity.push(key);
        }
    }

    randomNumber = Math.random() * varianceSum;
    var selectedAnimalId;
    let selectedAnimalVariance: number;
    for (let i = 0; i < animalsOfRarity.length; i++) {
        if (randomNumber > animalVariance[i]) {
            continue;
        }
        selectedAnimalId = animalsOfRarity[i];
        selectedAnimalVariance = Number(animalsObj[selectedAnimalId]['varianceInRarityGroup']) / varianceSum;
        break;
    }

    return {
        "AnimalId": selectedAnimalId,
        "AnimalVariance": selectedAnimalVariance
    }
}


//Cloud script that returns all unlockedOrbs
handlers.GetUnlockedOrbs = function (args) {

    var levelResult = server.GetPlayerStatistics({ PlayFabId: currentPlayerId });
    let playerLevel: number = levelResult.Statistics[0].Value;

    let levelBracket: number = 0;

    if (playerLevel >= 40) {
        levelBracket = 40;
    }
    else if (playerLevel >= 30) {
        levelBracket = 30;
    }
    else if (playerLevel >= 23) {
        levelBracket = 23;
    }
    else if (playerLevel >= 15) {
        levelBracket = 15;
    }
    else if (playerLevel >= 9) {
        levelBracket = 9;
    }
    else if (playerLevel >= 5) {
        levelBracket = 5;
    }
    else if (playerLevel >= 2) {
        levelBracket = 2;
    }
    else {
        levelBracket = 1;
    }

    var id = "S_" + levelBracket;

    var store = server.GetStoreItems({ StoreId: id });

    var playerInventory = server.GetUserInventory({ PlayFabId: currentPlayerId });
    var playerCurrency = playerInventory.VirtualCurrency["AP"];

    var result = {
        "StoreItems" : store.Store,
        "PlayerCurrency" : playerCurrency
    }

    return result;
}

handlers.NewUserInitialisation = function (args) {

}