//MAV_Maze_Rescue PlayFab CloudScripts. 
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
    var levelBracket = GetLevelBracket(playerLevel);
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
    var guid = Guid.newGuid();
    var updateString = JSON.stringify({
        "UID": guid,
        "Animal_ID": "D_B1_C1",
        "Diff": 0.5
    });
    server.UpdateUserData({
        PlayFabId: currentPlayerId,
        Data: { "CurrentRescueOperation": updateString }
    });
    var updateString = JSON.stringify({
        "Animals": []
    });
    server.UpdateUserData({
        PlayFabId: currentPlayerId,
        Data: { "CollectedAnimals": updateString }
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
    var levelBracket = GetLevelBracket(playerLevel);
    var storeId = "S_" + levelBracket;
    var store = server.GetStoreItems({ StoreId: storeId });
    var abilityOrbs = [];
    for (var i = 0; i < store.Store.length; i++) {
        var orb = {
            "ID": store.Store[i].ItemId,
            "Cost": store.Store[i].VirtualCurrencyPrices["AP"]
        };
        abilityOrbs.push(orb);
    }
    var animalData = server.GetUserData({ PlayFabId: currentPlayerId, Keys: ["CollectedAnimals"] });
    var animals = animalData.Data["CollectedAnimals"].Value;
    var animalsObject = JSON.parse(animals);
    var rescueOperationData = server.GetUserData({ PlayFabId: currentPlayerId, Keys: ["CurrentRescueOperation"] });
    var rescueOperationObject = JSON.parse(rescueOperationData.Data["CurrentRescueOperation"].Value);
    var result = {
        "Lvl": playerLevel,
        "Exp": playerExperience,
        "Exp_To_Lvl": exp2lvl,
        "AP": playerAP,
        "AOs": abilityOrbs,
        "Animal_IDs": animalsObject["Animals"],
        "RO": rescueOperationObject
    };
    return result;
};
handlers.ResolveRescueOperation = function (args) {
};
handlers.UseAbility = function (args) {
    var abilityId = args.AbilityId;
    var levelResult = server.GetPlayerStatistics({ PlayFabId: currentPlayerId });
    var playerLevel = levelResult.Statistics[0].Value;
    var levelBracket = GetLevelBracket(playerLevel);
    var storeId = "S_" + levelBracket;
    var store = server.GetStoreItems({ StoreId: storeId });
    if (store.Store.some(function (e) { return e.ItemId = abilityId; })) {
        var catalog = server.GetCatalogItems({});
        for (var i = 0; i < catalog.Catalog.length; i++) {
            if (catalog.Catalog[i].ItemId == abilityId) {
                var price = catalog.Catalog[i].VirtualCurrencyPrices["AP"];
                var id = catalog.Catalog[i].CustomData["Ability_ID"];
                var number = catalog.Catalog[i].CustomData["Characteristic_Number"];
                var result = {
                    "Ability_ID": id,
                    "Characteristic_Number": number
                };
                return number;
            }
        }
    }
};
function GetLevelBracket(level) {
    var playerLevel = level;
    var levelBracket;
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
    return levelBracket;
}
var Guid = /** @class */ (function () {
    function Guid() {
    }
    Guid.newGuid = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    return Guid;
}());
