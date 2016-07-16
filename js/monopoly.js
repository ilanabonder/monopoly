var Monopoly = {};
Monopoly.allowRoll = true;
Monopoly.moneyAtStart = 300; //money each user starts
Monopoly.doubleCounter = 0;

Monopoly.init = function(){
    $(document).ready(function(){
        Monopoly.adjustBoardSize(); //function that  makes the board responsive
        $(window).bind("resize",Monopoly.adjustBoardSize);
        Monopoly.initDice(); //game starts when user play the dices
        Monopoly.initPopups(); //start pop up to set num of player
        Monopoly.start(); //start the game    
    });
};

Monopoly.start = function(){
    Monopoly.showPopup("intro") //show pop up to set num of players
};


Monopoly.initDice = function(){ //function to play dices
    $(".dice").click(function(){ //user plays dices once he clicks on it
        if (Monopoly.allowRoll){ //function that checks if dices are allowed to be played
            Monopoly.rollDice(); //function that rolls dices
        }
    });
};


Monopoly.getCurrentPlayer = function(){ //gets the player and start this turn
    return $(".player.current-turn");
};

Monopoly.getPlayersCell = function(player){ //get current player cell to start moving player from the set cell
    return player.closest(".cell");
};


Monopoly.getPlayersMoney = function(player){ //gets player money
    return parseInt(player.attr("data-money"));
};

Monopoly.updatePlayersMoney = function(player,amount){ //updates player money
    var playersMoney = parseInt(player.attr("data-money"));
    playersMoney -= amount;
    if (playersMoney < 0 ){ //checks if player has no money, if so, the game ends for the player
        alert("You are broke!");
        $ (".cell."+ player.attr(id)).removeClass(player.attr(id)).addClass("available");
        player.remove(); //if no money player data and player are both removed
    }
    player.attr("data-money",playersMoney); //add money to player
    player.attr("title",player.attr("id") + ": $" + playersMoney);
    Monopoly.playSound("chaching");
};


Monopoly.rollDice = function(){
    var result1 = Math.floor(Math.random() * 6) + 1 ; //randomizes value for dice1
    var result2 = Math.floor(Math.random() * 6) + 1 ; //randomizes value for dice2
    $(".dice").find(".dice-dot").css("opacity",0);
    $(".dice#dice1").attr("data-num",result1).find(".dice-dot.num" + result1).css("opacity",1); //prints value to dice 1
    $(".dice#dice2").attr("data-num",result2).find(".dice-dot.num" + result2).css("opacity",1); //prints value to dice 2
    if (result1 == result2){ //if values are the same fr dice1 and dice2 allow player to have a second round and roll the dices again
        Monopoly.doubleCounter++;
    }
    var currentPlayer = Monopoly.getCurrentPlayer();
    Monopoly.handleAction(currentPlayer,"move",result1 + result2); //move the player according to the sum of the random value taken when playing the dices
};


Monopoly.movePlayer = function(player,steps){ //makes player walks on board
    Monopoly.allowRoll = false; //dices are allowed to be rolled once player fulfills the previous rolling steps and actions according to the set celle
    var playerMovementInterval = setInterval(function(){
        if (steps == 0){
            clearInterval(playerMovementInterval);
            Monopoly.handleTurn(player);
        }else{
            var playerCell = Monopoly.getPlayersCell(player); // reads the current cell to do all player steps accrding to the number got in dices
            var nextCell = Monopoly.getNextCell(playerCell); // when user is in the set cell it is supposed to be according to the number got in dices
            nextCell.find(".content").append(player); //get the set cell and do game command of the specific cell the user is in
            steps--;
        }
    },200);
};


Monopoly.handleTurn = function(){ //check possible actions for current class cell once player "arrives" in the cell
    var player = Monopoly.getCurrentPlayer(); 
    var playerCell = Monopoly.getPlayersCell(player);
    if (playerCell.is(".available.property")){
        Monopoly.handleBuyProperty(player,playerCell);
    }else if(playerCell.is(".property:not(.available)") && !playerCell.hasClass(player.attr("id"))){
         Monopoly.handlePayRent(player,playerCell);
    }else if(playerCell.is(".go-to-jail")){
        Monopoly.handleGoToJail(player);
    }else if(playerCell.is(".chance")){
        Monopoly.handleChanceCard(player);
    }else if(playerCell.is(".community")){
        Monopoly.handleCommunityCard(player);
    }else{
        Monopoly.setNextPlayerTurn();
    }
}

Monopoly.setNextPlayerTurn = function(){ //gets set for next round with the next player
    var currentPlayerTurn = Monopoly.getCurrentPlayer();  //set next round for next player
    var playerId = parseInt(currentPlayerTurn.attr("id").replace("player",""));

    if ($('#dice1').attr('data-num')!== $('#dice2').attr("data-num")) { //let player plays again once both dces have the same number

        var nextPlayerId = playerId + 1;
        if (nextPlayerId > $(".player").length) {
            nextPlayerId = 1;
        }
        currentPlayerTurn.removeClass("current-turn"); //once the round is played, remove class from user to pass it to next user and enable next user's round
        var nextPlayer = $(".player#player" + nextPlayerId);
        nextPlayer.addClass("current-turn"); //add class current turn so next user can play
        if (nextPlayer.is(".jailed")) {  //check if the next user is in jail
            var currentJailTime = parseInt(nextPlayer.attr("data-jail-time")); //and add a round missed to its jailtime
            currentJailTime++;
            nextPlayer.attr("data-jail-time", currentJailTime);
            if (currentJailTime > 3) { //if the jailtime is more than 3 rounds, let player out of the prision
                nextPlayer.removeClass("jailed");
                nextPlayer.removeAttr("data-jail-time");
            }
            Monopoly.setNextPlayerTurn();
            return;
        }
    }
    Monopoly.closePopup(); //close pop up once the player replies to pop up request
    Monopoly.allowRoll = true;
};


Monopoly.handleBuyProperty = function(player,propertyCell){ //once user clicks to buy poperty
    var propertyCost = Monopoly.calculateProperyCost(propertyCell); 
    var popup = Monopoly.getPopup("buy"); 
    popup.find(".cell-price").text(propertyCost); //show property cost and show option to buy in the pop up
    popup.find("button").unbind("click").bind("click",function(){
        var clickedBtn = $(this);
        if (clickedBtn.is("#yes")){
            Monopoly.handleBuy(player,propertyCell,propertyCost); //once player wants to buy go to the function that will check user money
        }else{
            Monopoly.closeAndNextTurn(); //if not, next turn
        }
    });
    Monopoly.showPopup("buy");
};

Monopoly.handlePayRent = function(player,propertyCell){ //if user needs to pay rent once in another users property cell
    var popup = Monopoly.getPopup("pay"); 
    var currentRent = parseInt(propertyCell.attr("data-rent"));
    var properyOwnerId = propertyCell.attr("data-owner");
    popup.find("#player-placeholder").text(properyOwnerId); //gets owner 
    popup.find("#amount-placeholder").text(currentRent); //gets ret cost
    popup.find("button").unbind("click").bind("click",function(){
        var properyOwner = $(".player#"+ properyOwnerId); 
        Monopoly.updatePlayersMoney(player,currentRent); //update the player money
        Monopoly.updatePlayersMoney(properyOwner,-1*currentRent); //update property owner's money
        Monopoly.closeAndNextTurn();
    });
   Monopoly.showPopup("pay"); 
};


Monopoly.handleGoToJail = function(player){ //makes user go to jail
    var popup = Monopoly.getPopup("jail");
    popup.find("button").unbind("click").bind("click",function(){ 
        Monopoly.handleAction(player,"jail"); 
    });
    Monopoly.showPopup("jail");
};


Monopoly.handleChanceCard = function(player){ //if player gets chance card, randomize it
    var popup = Monopoly.getPopup("chance");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com/get_random_chance_card", function(chanceJson){
        popup.find(".popup-content #text-placeholder").text(chanceJson["content"]);
        popup.find(".popup-title").text(chanceJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action",chanceJson["action"]).attr("data-amount",chanceJson["amount"]);
    },"json");
    popup.find("button").unbind("click").bind("click",function(){
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
        Monopoly.handleAction(player,action,amount);
    });
    Monopoly.showPopup("chance");
};

Monopoly.handleCommunityCard = function(player){ //if player gets community card, randomize it
    var popup = Monopoly.getPopup("community");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com/get_random_community_card", function(chanceJson){
        popup.find(".popup-content #text-placeholder").text(chanceJson["content"]);
        popup.find(".popup-title").text(chanceJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action",chanceJson["action"]).attr("data-amount",chanceJson["amount"]);
    },"json");
    popup.find("button").unbind("click").bind("click",function(){
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
        Monopoly.handleAction(player,action,amount);
    });
    Monopoly.showPopup("community");
    Monopoly.setNextPlayerTurn();
};


Monopoly.sendToJail = function(player){ //makes player go o jail and count his time on jail (up to 3 rounds)
    player.addClass("jailed");
    player.attr("data-jail-time",1);
    $(".corner.game.cell.in-jail").append(player);
    Monopoly.playSound("woopwoop");
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};


Monopoly.getPopup = function(popupId){
    return $(".popup-lightbox .popup-page#" + popupId);
};

Monopoly.calculateProperyCost = function(propertyCell){
    var cellGroup = propertyCell.attr("data-group");
    var cellPrice = parseInt(cellGroup.replace("group","")) * 5;
    if (cellGroup == "rail"){
        cellPrice = 10;
    }
    return cellPrice;
};


Monopoly.calculateProperyRent = function(propertyCost){
    return propertyCost/2;
};


Monopoly.closeAndNextTurn = function(){
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};

Monopoly.initPopups = function(){
    $(".popup-page#intro").find("button").click(function(){ //start game popup that allows user to set number of players
        var numOfPlayers = $(this).closest(".popup-page").find("input").val(); //var that gets number of players
        if (Monopoly.isValidInput("numofplayers",numOfPlayers)){ //check if input from user is Valid
            Monopoly.createPlayers(numOfPlayers);
            Monopoly.closePopup();
        }
    });
};


Monopoly.handleBuy = function(player,propertyCell,propertyCost){ //handle user buying action
    var playersMoney = Monopoly.getPlayersMoney(player)
    if (playersMoney < propertyCost){  //checks if player has enough money
        Monopoly.showErrorMsg();
        Monopoly.playSound("scream");
    }else{
        Monopoly.updatePlayersMoney(player,propertyCost); //if yes, take the amount required
        var rent = Monopoly.calculateProperyRent(propertyCost);

        propertyCell.removeClass("available")  //if buyer has enough money, add its properties to that cell
                    .addClass(player.attr("id"))
                    .attr("data-owner",player.attr("id"))
                    .attr("data-rent",rent);
        Monopoly.setNextPlayerTurn();
    }
};





Monopoly.handleAction = function(player,action,amount){ //checks possible actions once dices are played
    switch(action){
        case "move":
            Monopoly.movePlayer(player,amount);
             break;
        case "pay":
            Monopoly.updatePlayersMoney(player,amount);
            Monopoly.setNextPlayerTurn();
            break;
        case "jail":
            Monopoly.sendToJail(player);
            break;
    };
    Monopoly.closePopup();
};





Monopoly.createPlayers = function(numOfPlayers){ //create the players once user sets playernumber to start the game
    var startCell = $(".go");
    for (var i=1; i<= numOfPlayers; i++){
        var player = $("<div />").addClass("player shadowed").attr("id","player" + i).attr("title","player" + i + ": $" + Monopoly.moneyAtStart);
        startCell.find(".content").append(player);
        if (i==1){
            player.addClass("current-turn");
        }
        player.attr("data-money",Monopoly.moneyAtStart);
    }
};


Monopoly.getNextCell = function(cell){ //gets current cell of player so he can moves to the next cell by the # taken from played dices
    var currentCellId = parseInt(cell.attr("id").replace("cell",""));
    var nextCellId = currentCellId + 1;
    if (nextCellId > 40){
        Monopoly.handlePassedGo(); //checks if user can keep playing meaning if he still have money
        nextCellId = 1;
    }
    return $(".cell#cell" + nextCellId);
};


Monopoly.handlePassedGo = function(){ //get player money
    var player = Monopoly.getCurrentPlayer();
    Monopoly.updatePlayersMoney(player,-1*Monopoly.moneyAtStart/10);
};


Monopoly.isValidInput = function(validate,value){ //checks if input is true in start pop up
    var isValid = false;
    switch(validate){
        case "numofplayers": //checks if number of user is between 1 and 4
            if(value > 1 && value <= 4){
                isValid = true;
            }
            break;
    }

    if (!isValid){
        Monopoly.showErrorMsg();
    }
    return isValid;

}

Monopoly.showErrorMsg = function(){ //show if number of players is invalid and show warning
    $(".popup-page .invalid-error").fadeTo(500,1);
    setTimeout(function(){
            $(".popup-page .invalid-error").fadeTo(500,0);
    },4000);
};


Monopoly.adjustBoardSize = function(){ //board size responsive function
    var gameBoard = $(".board");
    var boardSize = Math.min($(window).height(),$(window).width());
    boardSize -= parseInt(gameBoard.css("margin-top")) *2;
    $(".board").css({"height":boardSize,"width":boardSize});
}

Monopoly.closePopup = function(){
    $(".popup-lightbox").fadeOut();
};

Monopoly.playSound = function(sound){
    var snd = new Audio("./sounds/" + sound + ".wav"); 
    snd.play();
}

Monopoly.showPopup = function(popupId){
    $(".popup-lightbox .popup-page").hide();
    $(".popup-lightbox .popup-page#" + popupId).show();
    $(".popup-lightbox").fadeIn();
};

Monopoly.init();