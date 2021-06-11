//MAV_Maze_Rescue PlayFab CloudScripts. 

//import { v4 as uuidv4 } from 'uuid';

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
        "StoreItems": store.Store,
        "PlayerCurrency": playerCurrency
    }

    return result;
}

//Cloud script that initalises new players
handlers.NewUserInitialisation = function (args) {
    server.UpdatePlayerStatistics(
        {
            PlayFabId: currentPlayerId,
            Statistics: [
                { StatisticName: "Level", Value: 1 },
                { StatisticName: "Experience", Value: 0 }
            ]
        });

    //var guid = uuidv4();

    server.UpdateUserData({
        PlayFabId: currentPlayerId,
        //Data: { "CurrentRescueOperation": "{\"Guid\":\"" + guid.toString + "\",\"AnimalId\":\"D_B1_C1\",\"Difficulty\":\"0.1\"}" }
    })

    server.UpdateUserData({
        PlayFabId: currentPlayerId,
        Data: { "CollectedAnimals": "[]" }
    })
}

//Cloud script that syncs local and cloud player data
handlers.PlayFabSync = function (args) {

    var levelResult = server.GetPlayerStatistics({ PlayFabId: currentPlayerId, StatisticNames: ["Level", "Experience"] });
    let playerLevel: number = levelResult.Statistics[0].Value;
    let playerExperience: number = levelResult.Statistics[1].Value;

    var playerInventoryResult = server.GetUserInventory({ PlayFabId: currentPlayerId });
    var playerAP = playerInventoryResult.VirtualCurrency["AP"];

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

    var storeId = "S_" + levelBracket;
    var store = server.GetStoreItems({ StoreId: storeId });

    let abilityOrbs = [];
    for (var item in store.Store) {
        var itemObject = JSON.parse(item);
        var orb = {
            "AbilityId": itemObject["ItemId"],
            "AbilityCost": itemObject
        }
        abilityOrbs.push(orb);
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
    var rescueOperationData = server.GetUserData({PlayFabId: currentPlayerId, Keys : ["CurrentRescueOperation"]})   

    var result = {
        "Level":playerLevel,
        "Experience":playerExperience,
        "AP":playerAP,
        "AbilityOrbs":abilityOrbs,
        //"Animals":animals,
        "RescueOperation":rescueOperationData.Data
    }

    return result;
}