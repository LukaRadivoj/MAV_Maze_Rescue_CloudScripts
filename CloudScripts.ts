//MAV_Maze_Rescue PlayFab CloudScripts. 

//Cloud script that generates Maze Configuration
handlers.GetMazeConfig = function (args) {

    var levelResult = server.GetPlayerStatistics({ PlayFabId: currentPlayerId });

    let playerLevel: number = levelResult.Statistics[0].Value;



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
    var titleDataResult = server.GetTitleData({ "Keys": ["Animals"] });
    var animals = titleDataResult.Data.Animals;
    var animalsObj = JSON.parse(animals);

    let animalsOfRarity: Array<string>;
    let animalVariance: Array<Number>;
    let varianceSum: number = 0;


    for (var key of Object.keys(animalsObj)) {
        var currentAnimal = animalsObj[key];

        if (currentAnimal['animalRarity'] == rarity) {
            var variance = (currentAnimal['varianceInRarityGroup']);
            let varianceNum: number = +(variance);
            varianceSum += varianceNum;

            animalVariance.push(varianceSum)
            animalsOfRarity.push(key);
            return { "sum": varianceSum }
        }
    }

    randomNumber = Math.random() * varianceSum;
    var selectedAnimalId;
    let selectedAnimalVariance: number;
    for (let i = 0; i < animalsOfRarity.length; i++) {
        if (randomNumber <= animalVariance[i]) {
            selectedAnimalId = animalsOfRarity[i];
            selectedAnimalVariance = Number(animalsObj[selectedAnimalId]['varianceInRarityGroup']) / varianceSum;
        }
    }

    return {
        "AnimalId": selectedAnimalId,
        "AnimalVariance": selectedAnimalVariance
    }
}


function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
