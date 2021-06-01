//MAV_Maze_Rescue PlayFab CloudScripts. 

//A function that generates an UID. Currently it is generating an UID by incrementing the old UID. If the old UID is null, then it returns 0.
function GenerateUID(oldUID){
    if(oldUID==null){
        return "0";
    }
    else{
        return (parseInt(oldUID)+1).toString();
    }
}

//A cloud script that is used for fetching UIDs related to progress and the player inventory.
handlers.GetUIDs=function(args, context){
    var request={
        PlayFabId:currentPlayerId,
        Keys:["ProgressUID", "InventoryUID"]
    }
    var internalData=server.GetUserInternalData(request);
    var progressUID=internalData.Data["ProgressUID"].Value;
    var inventoryUID=internalData.Data["InventoryUID"].Value;
    return {ProgressUID:progressUID, InventoryUID:inventoryUID};
}