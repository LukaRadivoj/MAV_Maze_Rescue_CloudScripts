//MAV_Maze_Rescue PlayFab CloudScripts. 
//import { v4 as uuidv4 } from 'uuid';
//Cloud script that generates Maze Configuration
handlers.GetMazeConfig = function (args) {
    var levelResult = server.GetPlayerStatistics({ PlayFabId: currentPlayerId });
    var playerLevel = levelResult.Statistics[0].Value;
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
    var animalsOfRarity = new Array();
    var animalVariance = new Array();
    var varianceSum = 0;
    for (var _i = 0, _a = Object.keys(animalsObj); _i < _a.length; _i++) {
        var key = _a[_i];
        var currentAnimal = animalsObj[key];
        if (currentAnimal['animalRarity'] == rarity) {
            var variance = (currentAnimal['varianceInRarityGroup']);
            var varianceNum = +(variance);
            varianceSum += varianceNum;
            animalVariance.push(varianceSum);
            animalsOfRarity.push(key);
        }
    }
    randomNumber = Math.random() * varianceSum;
    var selectedAnimalId;
    var selectedAnimalVariance;
    for (var i = 0; i < animalsOfRarity.length; i++) {
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
    };
};
//Cloud script that returns all unlockedOrbs
handlers.GetUnlockedOrbs = function (args) {
    var levelResult = server.GetPlayerStatistics({ PlayFabId: currentPlayerId });
    var playerLevel = levelResult.Statistics[0].Value;
    var levelBracket = 0;
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
        "StoreItems": store.Store,
        "PlayerCurrency": playerCurrency
    };
    return result;
};
//Cloud script that initalises new players
handlers.NewUserInitialisation = function (args) {
    server.UpdatePlayerStatistics({
        PlayFabId: currentPlayerId,
        Statistics: [
            { StatisticName: "Level", Value: 1 },
            { StatisticName: "Experience", Value: 0 }
        ]
    });
    //var guid = uuidv4();
    server.UpdateUserData({
        PlayFabId: currentPlayerId
    });
    server.UpdateUserData({
        PlayFabId: currentPlayerId,
        Data: { "CollectedAnimals": "[]" }
    });
};
//Cloud script that syncs local and cloud player data
handlers.PlayFabSync = function (args) {
    var levelResult = server.GetPlayerStatistics({ PlayFabId: currentPlayerId, StatisticNames: ["Level", "Experience"] });
    var playerLevel = levelResult.Statistics[0].Value;
    var playerExperience = levelResult.Statistics[1].Value;
    var titleDataResult = server.GetTitleData({ Keys: ["Levels"] });
    var expLvlobject = JSON.parse(titleDataResult.Data["Levels"]);
    var exp2lvl = expLvlobject[playerLevel];
    var playerInventoryResult = server.GetUserInventory({ PlayFabId: currentPlayerId });
    var playerAP = playerInventoryResult.VirtualCurrency["AP"];
    var levelBracket = 0;
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
    var storeId = "S_" + levelBracket;
    var store = server.GetStoreItems({ StoreId: storeId });
    var catalog = server.GetCatalogItems({});
    var abilityOrbs = [];
    for (var i = 0; i < store.Store.length; i++) {
        abilityOrbs.push(store.Store[i].ItemId);
    }
    //Requires GUID
    /*
    var animalData = server.GetUserData({ PlayFabId: currentPlayerId , Keys : ["Animals"]})
    let animals = [];

    for (var animal in animalData.Data){
        var animalObj = JSON.parse(animal);
        var tmpAnimal = {
            "Guid" : uuidv4(),
            "AnimalId" : animalObj.key
        }
        animals.push(tmpAnimal);
    }
    */
    var rescueOperationData = server.GetUserData({ PlayFabId: currentPlayerId, Keys: ["CurrentRescueOperation"] });
    var rescueOperationObject = JSON.parse(rescueOperationData.Data["CurrentRescueOperation"].Value);
    var result = {
        "LVL": playerLevel,
        "EXP": playerExperience,
        "EXP_TO_LVL": exp2lvl,
        "AP": playerAP,
        "AO_IDs": abilityOrbs,
        //"Animals":animals,
        "RO": rescueOperationObject
    };
    return result;
};
