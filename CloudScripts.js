//MAV_Maze_Rescue PlayFab CloudScripts. 
//Cloud script that generates Maze Configuration
handlers.GetMazeConfig = function (args) {
    var levelResult = server.GetPlayerStatistics({ PlayFabId: currentPlayerId, StatisticNames: ["Level"] });
    var playerLevel = levelResult.Statistics[0].Value;
    //Choosing Rarity
    var rarity;
    var randomNumber;
    if (playerLevel < 5) {
        randomNumber = Math.floor(Math.random() * 51);
    }
    else if (playerLevel < 10) {
        randomNumber = Math.floor(Math.random() * 81);
    }
    else if (playerLevel < 16) {
        randomNumber = Math.floor(Math.random() * 96);
    }
    else if (playerLevel < 22) {
        randomNumber = Math.floor(Math.random() * 100);
    }
    else {
        randomNumber = Math.floor(Math.random() * 101);
    }
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
        rarity = "Super Rare";
    }
    else {
        rarity = "Ultra Rare";
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
    var levelResult = server.GetPlayerStatistics({ PlayFabId: currentPlayerId, StatisticNames: ["Level"] });
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
        "Animal_ID": "D_B8_C2",
        "Diff": 0.15,
        "AdWatched": false
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
    var titleDataResult = server.GetTitleData({ Keys: ["Boards"] });
    var boardsObject = JSON.parse(titleDataResult.Data["Boards"]);
    var currentTitleBoard = boardsObject["Board_1"];
    var currentPlayerBoard = [];
    for (var i = 0; i < 7; i++) {
        currentPlayerBoard.push({
            "RewardType": currentTitleBoard["Rewards"][i]["RewardType"],
            "RewardIndex": currentTitleBoard["Rewards"][i]["RewardIndex"],
            "RewardData": currentTitleBoard["Rewards"][i]["RewardData"],
            "Completed": false
        });
    }
    var today = new Date();
    today.setTime(0);
    var updateString = JSON.stringify({
        "CurrentStreak": 0,
        "CurrentRewardIndex": 0,
        "LastLoginDay": today,
        "PlayerSpawnRateBoost": 1,
        "CurrentBoard": currentPlayerBoard,
        "CurrentBoardID": "Board_1"
    });
    server.UpdateUserData({
        PlayFabId: currentPlayerId,
        Data: { "DailyRewards": updateString }
    });
};
//Cloud script that syncs local and cloud player data
handlers.PlayFabSync = function (args) {
    var levelResult = server.GetPlayerStatistics({ PlayFabId: currentPlayerId, StatisticNames: ["Level", "Experience"] });
    var playerLevel;
    var playerExperience;
    if (levelResult.Statistics[0].StatisticName == "Level") {
        playerLevel = levelResult.Statistics[0].Value;
        playerExperience = levelResult.Statistics[1].Value;
    }
    else {
        playerExperience = levelResult.Statistics[0].Value;
        playerLevel = levelResult.Statistics[1].Value;
    }
    var titleDataResult = server.GetTitleData({ Keys: ["Levels"] });
    var expLvlobject = JSON.parse(titleDataResult.Data["Levels"]);
    var exp2lvl = expLvlobject[playerLevel];
    var playerInventoryResult = server.GetUserInventory({ PlayFabId: currentPlayerId });
    var removeAds = false;
    for (var i = 0; i < playerInventoryResult.Inventory.length; i++) {
        if (playerInventoryResult.Inventory[i].ItemId == "iap_5") {
            removeAds = true;
        }
    }
    var levelBracket = GetLevelBracket(playerLevel);
    var storeId = "S_" + levelBracket;
    var store = server.GetStoreItems({ StoreId: storeId });
    var abilityOrbs = [];
    for (var i_1 = 0; i_1 < store.Store.length; i_1++) {
        var orb = {
            "ID": store.Store[i_1].ItemId,
            "Cost": store.Store[i_1].VirtualCurrencyPrices["AP"]
        };
        abilityOrbs.push(orb);
    }
    var animalData = server.GetUserData({ PlayFabId: currentPlayerId, Keys: ["CollectedAnimals"] });
    var animals = animalData.Data["CollectedAnimals"].Value;
    var animalsObject = JSON.parse(animals);
    var rescueOperationData = server.GetUserData({ PlayFabId: currentPlayerId, Keys: ["CurrentRescueOperation"] });
    var rescueOperationObject = JSON.parse(rescueOperationData.Data["CurrentRescueOperation"].Value);
    var dailyRewardsData = server.GetUserData({ PlayFabId: currentPlayerId, Keys: ["DailyRewards"] });
    var dailyRewardsObject = JSON.parse(dailyRewardsData.Data["DailyRewards"].Value);
    var currentRewardIndex = dailyRewardsObject["CurrentRewardIndex"];
    var currentStreak = dailyRewardsObject["CurrentStreak"];
    var playerSpawnRateBoost = dailyRewardsObject["PlayerSpawnRateBoost"];
    var currentBoardID = dailyRewardsObject["CurrentBoardID"];
    var currentPlayerBoard = dailyRewardsObject["CurrentBoard"];
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var lastLoginDay = new Date(dailyRewardsObject["LastLoginDay"]);
    titleDataResult = server.GetTitleData({ Keys: ["Boards"] });
    var boardsObject = JSON.parse(titleDataResult.Data["Boards"]);
    if (lastLoginDay.getTime() != today.getTime()) {
        var yesterday = new Date();
        yesterday.setTime(today.getTime());
        yesterday.setDate(yesterday.getDate() - 1);
        if (yesterday.getTime() == lastLoginDay.getTime()) {
            currentRewardIndex = (currentRewardIndex + 1) % 7;
            if (currentRewardIndex == 0) {
                currentStreak += 1;
                currentBoardID = boardsObject[currentBoardID]["NextBoard"];
                playerSpawnRateBoost = 1;
                var currentTitleBoard = boardsObject[currentBoardID];
                currentPlayerBoard = [];
                for (var i = 0; i < 7; i++) {
                    currentPlayerBoard.push({
                        "RewardType": currentTitleBoard["Rewards"][i]["RewardType"],
                        "RewardIndex": currentTitleBoard["Rewards"][i]["RewardIndex"],
                        "RewardData": currentTitleBoard["Rewards"][i]["RewardData"],
                        "Completed": false
                    });
                }
            }
        }
        else {
            currentStreak = 1;
            currentRewardIndex = 0;
            currentBoardID = "Board_1";
            playerSpawnRateBoost = 1;
            var currentTitleBoard = boardsObject[currentBoardID];
            currentPlayerBoard = [];
            for (var i = 0; i < 7; i++) {
                currentPlayerBoard.push({
                    "RewardType": currentTitleBoard["Rewards"][i]["RewardType"],
                    "RewardIndex": currentTitleBoard["Rewards"][i]["RewardIndex"],
                    "RewardData": currentTitleBoard["Rewards"][i]["RewardData"],
                    "Completed": false
                });
            }
        }
        lastLoginDay.setTime(today.getTime());
        var reward;
        for (var i = 0; i < 7; i++) {
            if (currentPlayerBoard[i]["RewardIndex"] == currentRewardIndex) {
                currentPlayerBoard[i]["Completed"] = true;
                reward = currentPlayerBoard[i];
            }
        }
        var playerAP = playerInventoryResult.VirtualCurrency["AP"];
        var playerSO = playerInventoryResult.VirtualCurrency["SO"];
        switch (reward["RewardType"]) {
            case "SO":
                playerSO += parseInt(reward["RewardData"]);
                server.AddUserVirtualCurrency({ PlayFabId: currentPlayerId, Amount: +reward["RewardData"], VirtualCurrency: "SO" });
                break;
            case "AP":
                playerAP += parseInt(reward["RewardData"]);
                server.AddUserVirtualCurrency({ PlayFabId: currentPlayerId, Amount: +reward["RewardData"], VirtualCurrency: "AP" });
                break;
        }
        var updateString = JSON.stringify({
            "CurrentStreak": currentStreak,
            "CurrentRewardIndex": currentRewardIndex,
            "LastLoginDay": lastLoginDay,
            "PlayerSpawnRateBoost": playerSpawnRateBoost,
            "CurrentBoard": currentPlayerBoard,
            "CurrentBoardID": currentBoardID
        });
        server.UpdateUserData({
            PlayFabId: currentPlayerId,
            Data: { "DailyRewards": updateString }
        });
    }
    if (playerLevel == 1) {
        var result = {
            "Lvl": playerLevel,
            "Exp": 0,
            "Exp_To_Lvl": 50,
            "AP": playerAP,
            "SO": playerSO,
            "AOs": abilityOrbs,
            "Animal_IDs": animalsObject["Animals"],
            "RO": rescueOperationObject,
            "Remove_Ads": removeAds,
            "CurrentBoard": currentPlayerBoard,
            "CurrentStreak": currentStreak,
            "CurrentSpawnRateBonus": playerSpawnRateBoost,
            "CurrentRewardIndex": currentRewardIndex
        };
    }
    else {
        var result = {
            "Lvl": playerLevel,
            "Exp": playerExperience - expLvlobject[playerLevel - 1],
            "Exp_To_Lvl": exp2lvl - expLvlobject[playerLevel - 1],
            "AP": playerAP,
            "SO": playerSO,
            "AOs": abilityOrbs,
            "Animal_IDs": animalsObject["Animals"],
            "RO": rescueOperationObject,
            "Remove_Ads": removeAds,
            "CurrentBoard": currentPlayerBoard,
            "CurrentStreak": currentStreak,
            "CurrentSpawnRateBonus": playerSpawnRateBoost,
            "CurrentRewardIndex": currentRewardIndex
        };
    }
    return result;
};
handlers.ResolveRescueOperation = function (args) {
    var _a;
    var animalId = args.AnimalId;
    var diff = args.Difficulty;
    var success = args.Success;
    var turnsLeft = args.TurnsLeft;
    var turnsGiven = args.TurnsGiven;
    var alreadyOwned = false;
    var rescueOperationData = server.GetUserData({ PlayFabId: currentPlayerId, Keys: ["CurrentRescueOperation"] });
    var rescueOperationObject = JSON.parse(rescueOperationData.Data["CurrentRescueOperation"].Value);
    if (turnsGiven == -1 && turnsLeft == -1) {
        var newRescueOperation = GetNewRescueOperation();
        var newRescueString = JSON.stringify(newRescueOperation);
        server.UpdateUserData({
            PlayFabId: currentPlayerId,
            Data: { "CurrentRescueOperation": newRescueString }
        });
        var skipResult = {
            "RO_Code": 'SK',
            "RO": newRescueOperation
        };
        return skipResult;
    }
    else {
        var playerInventoryResult = server.GetUserInventory({ PlayFabId: currentPlayerId });
        var removeAds = false;
        for (var i = 0; i < playerInventoryResult.Inventory.length; i++) {
            if (playerInventoryResult.Inventory[i].ItemId == "iap_5") {
                removeAds = true;
            }
        }
        if (success && animalId == rescueOperationObject["Animal_ID"] && diff == rescueOperationObject["Diff"]) {
            var animalData = server.GetUserData({ PlayFabId: currentPlayerId, Keys: ["CollectedAnimals"] });
            var animals = animalData.Data["CollectedAnimals"].Value;
            var animalsObject = JSON.parse(animals);
            var animalStringArray = animalsObject["Animals"];
            if (animalStringArray.some(function (animal) { return animal == animalId; })) {
                alreadyOwned = true;
            }
            var newAnimal;
            if (!alreadyOwned) {
                newAnimal = animalId;
            }
            //COUNTING ANIMALS
            var found = false;
            var animalCount = server.GetUserData({ PlayFabId: currentPlayerId, Keys: ["AnimalCount"] });
            if (Object.keys(animalCount.Data).length != 0) {
                var animalCountObject = JSON.parse(animalCount.Data["AnimalCount"].Value);
                for (var _i = 0, _b = Object.keys(animalCountObject); _i < _b.length; _i++) {
                    var key = _b[_i];
                    if (key == animalId) {
                        animalCountObject[key] += 1;
                        found = true;
                    }
                }
                if (!found) {
                    animalCountObject[animalId] = 1;
                }
                server.UpdateUserData({
                    PlayFabId: currentPlayerId,
                    Data: { "AnimalCount": JSON.stringify(animalCountObject) }
                });
            }
            else {
                server.UpdateUserData({
                    PlayFabId: currentPlayerId,
                    Data: { "AnimalCount": JSON.stringify((_a = {}, _a[animalId] = 1, _a)) }
                });
            }
            var rarity;
            var titleDataResult = server.GetTitleData({ "Keys": ["Animals"] });
            var animals = titleDataResult.Data.Animals;
            var animalsObj = JSON.parse(animals);
            for (var _c = 0, _d = Object.keys(animalsObj); _c < _d.length; _c++) {
                var key = _d[_c];
                var currentAnimal = animalsObj[key];
                if (key == animalId) {
                    rarity = currentAnimal['animalRarity'];
                }
            }
            var expRarityMulty;
            switch (rarity) {
                case "Common":
                    expRarityMulty = 1;
                    break;
                case "Uncommon":
                    expRarityMulty = 1.1;
                    break;
                case "Rare":
                    expRarityMulty = 1.2;
                    break;
                case "Super Rare":
                    expRarityMulty = 1.3;
                    break;
                case "Ultra Rare":
                    expRarityMulty = 1.4;
                    break;
            }
            var turnsLeft = args.TurnsLeft;
            var turnsGiven = args.TurnsGiven;
            var expSkillMulty = turnsLeft / turnsGiven;
            var expGain = Math.floor(expRarityMulty * 100 * expSkillMulty);
            if (alreadyOwned) {
                var currencyGain = Math.floor(20 * diff);
                server.AddUserVirtualCurrency({ PlayFabId: currentPlayerId, Amount: currencyGain, VirtualCurrency: "AP" });
            }
            var levelResult = server.GetPlayerStatistics({ PlayFabId: currentPlayerId, StatisticNames: ["Level", "Experience"] });
            var playerLevel = void 0;
            var playerExperience = void 0;
            if (levelResult.Statistics[0].StatisticName == "Level") {
                playerLevel = levelResult.Statistics[0].Value;
                playerExperience = levelResult.Statistics[1].Value;
            }
            else {
                playerExperience = levelResult.Statistics[0].Value;
                playerLevel = levelResult.Statistics[1].Value;
            }
            var newAbilityOrbs = [];
            var exp2lvl = 0;
            var newUnlockedRarity = null;
            if (playerLevel < 40) {
                var titleDataResult = server.GetTitleData({ Keys: ["Levels"] });
                var expLvlobject = JSON.parse(titleDataResult.Data["Levels"]);
                exp2lvl = expLvlobject[playerLevel];
                var lvlBracketBefore = GetLevelBracket(playerLevel);
                if (playerExperience + expGain >= exp2lvl) {
                    playerLevel++;
                    switch (playerLevel) {
                        case 5:
                            newUnlockedRarity = "Uncommon";
                            break;
                        case 10:
                            newUnlockedRarity = "Rare";
                            break;
                        case 16:
                            newUnlockedRarity = "Super Rare";
                            break;
                        case 22:
                            newUnlockedRarity = "Ultra Rare";
                            break;
                    }
                    exp2lvl = expLvlobject[playerLevel];
                }
                playerExperience += expGain;
                var newBracket = GetLevelBracket(playerLevel);
                if (newBracket > lvlBracketBefore) {
                    var storeBeforeId = "S_" + lvlBracketBefore;
                    var storeBefore = server.GetStoreItems({ StoreId: storeBeforeId });
                    var storeAfterId = "S_" + newBracket;
                    var storeAfter = server.GetStoreItems({ StoreId: storeAfterId });
                    var _loop_1 = function (i_2) {
                        if (!(storeBefore.Store.some(function (e) { return e.ItemId == storeAfter.Store[i_2].ItemId; }))) {
                            orb = {
                                "ID": storeAfter.Store[i_2].ItemId,
                                "Cost": storeAfter.Store[i_2].VirtualCurrencyPrices["AP"]
                            };
                            newAbilityOrbs.push(orb);
                        }
                    };
                    var orb;
                    for (var i_2 = 0; i_2 < storeAfter.Store.length; i_2++) {
                        _loop_1(i_2);
                    }
                }
                server.UpdatePlayerStatistics({
                    PlayFabId: currentPlayerId,
                    Statistics: [
                        { StatisticName: "Level", Value: playerLevel },
                        { StatisticName: "Experience", Value: playerExperience }
                    ]
                });
            }
            var newRescueOperation = GetNewRescueOperation();
            var newRescueString = JSON.stringify(newRescueOperation);
            server.UpdateUserData({
                PlayFabId: currentPlayerId,
                Data: { "CurrentRescueOperation": newRescueString }
            });
            if (newAnimal != null) {
                var animalData = server.GetUserData({ PlayFabId: currentPlayerId, Keys: ["CollectedAnimals"] });
                var animals = animalData.Data["CollectedAnimals"].Value;
                var animalsObj = JSON.parse(animals);
                animalsObj['Animals'].push(newAnimal);
                server.UpdateUserData({
                    PlayFabId: currentPlayerId,
                    Data: { "CollectedAnimals": JSON.stringify(animalsObj) }
                });
            }
            var playerInventoryResult = server.GetUserInventory({ PlayFabId: currentPlayerId });
            var playerSO = playerInventoryResult.VirtualCurrency["SO"];
            var result = {
                "RO_Code": 'SF',
                "New_Animal": newAnimal,
                "New_AOs": newAbilityOrbs,
                "Exp": playerExperience - expLvlobject[playerLevel - 1],
                "Lvl": playerLevel,
                "Exp_To_Lvl": exp2lvl - expLvlobject[playerLevel - 1],
                "RO": newRescueOperation,
                "Remove_Ads": removeAds,
                "SO": playerSO,
                "NewUnlockedRarity": newUnlockedRarity
            };
            return result;
        }
        else if (!success && animalId == rescueOperationObject["Animal_ID"] && diff == rescueOperationObject["Diff"]) {
            var addWatched = rescueOperationObject["AdWatched"];
            if (addWatched) {
                var turnsLeft = args.TurnsLeft;
                var turnsGiven = args.TurnsGiven;
                var expRarityMulty;
                var rarity;
                var titleDataResult = server.GetTitleData({ "Keys": ["Animals"] });
                var animals = titleDataResult.Data.Animals;
                var animalsObj = JSON.parse(animals);
                for (var _e = 0, _f = Object.keys(animalsObj); _e < _f.length; _e++) {
                    var key = _f[_e];
                    var currentAnimal = animalsObj[key];
                    if (key == animalId) {
                        rarity = currentAnimal['animalRarity'];
                    }
                }
                switch (rarity) {
                    case "Common":
                        expRarityMulty = 1.0;
                        break;
                    case "Uncommon":
                        expRarityMulty = 1.1;
                        break;
                    case "Rare":
                        expRarityMulty = 1.2;
                        break;
                    case "Super Rare":
                        expRarityMulty = 1.3;
                        break;
                    case "Ultra Rare":
                        expRarityMulty = 1.4;
                        break;
                }
                var expSkillMulty = 1 + (1 - turnsLeft / turnsGiven);
                var expGain = Math.floor(expRarityMulty * 20 * expSkillMulty);
                var levelResult = server.GetPlayerStatistics({ PlayFabId: currentPlayerId, StatisticNames: ["Level", "Experience"] });
                var playerLevel = void 0;
                var playerExperience = void 0;
                if (levelResult.Statistics[0].StatisticName == "Level") {
                    playerLevel = levelResult.Statistics[0].Value;
                    playerExperience = levelResult.Statistics[1].Value;
                }
                else {
                    playerExperience = levelResult.Statistics[0].Value;
                    playerLevel = levelResult.Statistics[1].Value;
                }
                var titleDataResult = server.GetTitleData({ Keys: ["Levels"] });
                var expLvlobject = JSON.parse(titleDataResult.Data["Levels"]);
                var exp2lvl = expLvlobject[playerLevel];
                var lvlBracketBefore = GetLevelBracket(playerLevel);
                var newUnlockedRarity = null;
                if (playerExperience + expGain > exp2lvl) {
                    playerLevel++;
                    exp2lvl = expLvlobject[playerLevel];
                    switch (playerLevel) {
                        case 5:
                            newUnlockedRarity = "Uncommon";
                            break;
                        case 10:
                            newUnlockedRarity = "Rare";
                            break;
                        case 16:
                            newUnlockedRarity = "Super Rare";
                            break;
                        case 22:
                            newUnlockedRarity = "Ultra Rare";
                            break;
                    }
                }
                playerExperience += expGain;
                var newBracket = GetLevelBracket(playerLevel);
                var newAbilityOrbs = [];
                if (newBracket > lvlBracketBefore) {
                    var storeBeforeId = "S_" + lvlBracketBefore;
                    var storeBefore = server.GetStoreItems({ StoreId: storeBeforeId });
                    var storeAfterId = "S_" + newBracket;
                    var storeAfter = server.GetStoreItems({ StoreId: storeAfterId });
                    var _loop_2 = function (i_3) {
                        if (!(storeBefore.Store.some(function (e) { return e.ItemId == storeAfter.Store[i_3].ItemId; }))) {
                            orb = {
                                "ID": storeAfter.Store[i_3].ItemId,
                                "Cost": storeAfter.Store[i_3].VirtualCurrencyPrices["AP"]
                            };
                            newAbilityOrbs.push(orb);
                        }
                    };
                    var orb;
                    for (var i_3 = 0; i_3 < storeAfter.Store.length; i_3++) {
                        _loop_2(i_3);
                    }
                }
                server.UpdatePlayerStatistics({
                    PlayFabId: currentPlayerId,
                    Statistics: [
                        { StatisticName: "Level", Value: playerLevel },
                        { StatisticName: "Experience", Value: playerExperience }
                    ]
                });
                var newRescueOperation = GetNewRescueOperation();
                var newRescueString = JSON.stringify(newRescueOperation);
                server.UpdateUserData({
                    PlayFabId: currentPlayerId,
                    Data: { "CurrentRescueOperation": newRescueString }
                });
                var playerInventoryResult = server.GetUserInventory({ PlayFabId: currentPlayerId });
                var playerSO = playerInventoryResult.VirtualCurrency["SO"];
                var failComercialResult = {
                    "RO_Code": 'FF',
                    "New_AOs": newAbilityOrbs,
                    "Exp": playerExperience - expLvlobject[playerLevel - 1],
                    "Lvl": playerLevel,
                    "Exp_To_Lvl": exp2lvl - expLvlobject[playerLevel - 1],
                    "RO": newRescueOperation,
                    "Remove_Ads": removeAds,
                    "SO": playerSO,
                    "NewUnlockedRarity": newUnlockedRarity
                };
                return failComercialResult;
            }
            else {
                var updateString = JSON.stringify({
                    "UID": rescueOperationObject["UID"],
                    "Animal_ID": rescueOperationObject["Animal_ID"],
                    "Diff": rescueOperationObject["Diff"],
                    "AdWatched": true
                });
                server.UpdateUserData({
                    PlayFabId: currentPlayerId,
                    Data: { "CurrentRescueOperation": updateString }
                });
                var numberOfMoves = Math.floor(diff * 20);
                var noResult = {
                    "RO_Code": 'FC',
                    "Add_Moves": numberOfMoves
                };
                return noResult;
            }
        }
    }
};
handlers.UseAbility = function (args) {
    var abilityId = args.AbilityId;
    var levelResult = server.GetPlayerStatistics({ PlayFabId: currentPlayerId, StatisticNames: ["Level"] });
    var playerLevel = levelResult.Statistics[0].Value;
    var levelBracket = GetLevelBracket(playerLevel);
    var storeId = "S_" + levelBracket;
    var store = server.GetStoreItems({ StoreId: storeId });
    if (store.Store.some(function (e) { return e.ItemId = abilityId; })) {
        var catalog = server.GetCatalogItems({});
        for (var i = 0; i < catalog.Catalog.length; i++) {
            if (catalog.Catalog[i].ItemId == abilityId) {
                var price = catalog.Catalog[i].VirtualCurrencyPrices["AP"];
                var playerInventoryResult = server.GetUserInventory({ PlayFabId: currentPlayerId });
                var playerAP = playerInventoryResult.VirtualCurrency["AP"];
                if (price <= playerAP) {
                    server.SubtractUserVirtualCurrency({ PlayFabId: currentPlayerId, Amount: price, VirtualCurrency: "AP" });
                    var customData = catalog.Catalog[i].CustomData;
                    var customDataObject = JSON.parse(customData);
                    return customDataObject;
                }
                else {
                    return {
                        "Ability_ID": null,
                        "Characteristic_Number": null
                    };
                }
            }
        }
    }
};
handlers.UseSkip = function (args) {
    var playerInventoryResult = server.GetUserInventory({ PlayFabId: currentPlayerId });
    var playerSO = playerInventoryResult.VirtualCurrency["SO"];
    if (playerSO > 0) {
        server.SubtractUserVirtualCurrency({ PlayFabId: currentPlayerId, Amount: 1, VirtualCurrency: "SO" });
        playerSO -= 1;
    }
    return {
        "SO": playerSO
    };
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
function GetNewRescueOperation() {
    var levelResult = server.GetPlayerStatistics({ PlayFabId: currentPlayerId, StatisticNames: ["Level"] });
    var playerLevel = levelResult.Statistics[0].Value;
    //Choosing Rarity
    var rarity;
    var rarityMulty;
    var randomNumber;
    randomNumber = Math.floor(Math.random() * 1067);
    if (randomNumber == 420) {
        rarity = "Mythical";
        rarityMulty = 0.001;
    }
    else {
        if (playerLevel < 5) {
            randomNumber = Math.floor(Math.random() * 51);
        }
        else if (playerLevel < 10) {
            randomNumber = Math.floor(Math.random() * 81);
        }
        else if (playerLevel < 16) {
            randomNumber = Math.floor(Math.random() * 96);
        }
        else if (playerLevel < 22) {
            randomNumber = Math.floor(Math.random() * 100);
        }
        else {
            randomNumber = Math.floor(Math.random() * 101);
        }
        if (randomNumber <= 50) {
            rarity = "Common";
            rarityMulty = 0.5;
        }
        else if (randomNumber > 50 && randomNumber <= 80) {
            rarity = "Uncommon";
            rarityMulty = 0.3;
        }
        else if (randomNumber > 80 && randomNumber <= 95) {
            rarity = "Rare";
            rarityMulty = 0.15;
        }
        else if (randomNumber > 95 && randomNumber <= 99) {
            rarity = "Super Rare";
            rarityMulty = 0.04;
        }
        else {
            rarity = "Ultra Rare";
            rarityMulty = 0.01;
        }
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
    var diff = (1 - rarityMulty) * (1 - selectedAnimalVariance);
    var diff = Math.round(diff * 10000) / 10000;
    return {
        "UID": Guid.newGuid(),
        "Animal_ID": selectedAnimalId,
        "Diff": diff,
        "AdWatched": false
    };
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
