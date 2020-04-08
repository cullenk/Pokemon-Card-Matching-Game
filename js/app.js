/*jshint esversion: 8 */

const loadingScreen = document.getElementById('loading-screen');
const gameContainer = document.getElementById('game-container'); //Grab the game container

// GET THE POKEMON DATA FROM THE POKEAPI
const fetchPokemon = async () => { //create a function to fetch the pokemon API. Make it asynchronous.
  const promises = []; // Store the promises in an empty array so we can access them later.

  for (let i = 1; i < 9; i++) { //Create 8 cards
    let randomIndex = Math.floor(Math.random() * 151 + 1); //each with a random index number between 1-151.
    const url = `https://pokeapi.co/api/v2/pokemon/` + randomIndex; //Get the pokeAPI, add the random index number to the url
      promises.push(fetch(url) //Actually fetch the pokeAPI, store it in the promises array.
        .then(response => response.json()) //then take that response and put it into json.
      );
    }

    await Promise.all(promises).then( results => { //await all of the promises so nothing will load until they're ready.
      const pokemon = results.map((data) => ({ //map over each result, passing in the data, create object pairs for each.
        name: data.name, //obtain the pokemon name
        id: data.id, //obtain the pokemon id
        image: data.sprites.front_default //obtain the pokemon image
      }));
      generatePokemonCards(pokemon); //call the generatePokemonCards function, pass it the variable holding the data.
    });
  };

// CREATE CARDS USING THE DATA RECEIVED
const generatePokemonCards = (pokemon) => { //Create a function called generatePokemonCards, it expects a parameter of pokemon
  console.log(pokemon); //log each to make sure its working
  //map over each pokemon, generate the following html for each individual part of that group (pokeman).
  const pokemonHTMLString = pokemon.map( pokeman => `
    <div class="card">
      <div class="card-back card-face">
        <img src="img/pokeball.png">
      </div>
      <div class="card-front card-face">
        <img class="card-value" src="${pokeman.image}">
      </div>
    </div>
    <div class="card">
      <div class="card-back card-face">
        <img src="img/pokeball.png">
      </div>
      <div class="card-front card-face">
        <img class="card-value" src="${pokeman.image}">
      </div>
    </div>
    `)
    .join(''); //the map returns an array, use join to make it a string.
    gameContainer.innerHTML = pokemonHTMLString; //Target the game container, input all of these cards.
};

//CONTROL THE AUDIO ELEMENTS
class AudioController { // create a new class class called AudioController
    constructor() { //Give it the following specifics
        this.bgMusic = document.getElementById('pokemon-theme');
        this.flipSound = document.getElementById('flip-sound');
        this.matchSound = document.getElementById('match-sound');
        this.victorySound = document.getElementById('victory-sound');
        this.gameOverSound = document.getElementById('gameover-sound');
        this.bgMusic.volume = 0.5; //sets volume to 50% of the original level.
        this.bgMusic.loop = true; //the music will keep playing over.
    }
    startMusic() { //Each one of these is a method, a mini function that can be accessed when needed
        this.bgMusic.play(); //play() and pause() are functions already defined in JavaScript library
    }
    stopMusic() {
        this.bgMusic.pause();
        this.bgMusic.currentTime = 0; //reset the song
    }
    flip() {
        this.flipSound.play();
    }
    match() {
        this.matchSound.play();
    }
    victory() {
        this.stopMusic();
        this.victorySound.play();
    }
    gameOver() {
        this.stopMusic();
        this.gameOverSound.play();
    }
}

// THE GAME COMPONENTS
class PokemonMatch {
    constructor(totalTime, cards) {
        this.cardsArray = cards;//these are set from the constructor, passed in
        this.totalTime = totalTime;
        this.timeRemaining = totalTime;
        this.timer = document.getElementById('time-remaining'); //these are set dynamically
        this.ticker = document.getElementById('flips');
        this.audioController = new AudioController();
    }
    startGame() { //All of this goes into effect when the startGame() function is called
        this.cardToCheck = null; //None of the cards are active, make this null.
        this.totalClicks = 0;
        this.timeRemaining = this.totalTime;
        this.matchedCards = [];
        this.busy = true; //when the game starts, initially make the cards non-interactive
        setTimeout(() => { //Ater .5 seconds...
            this.audioController.startMusic();
            this.shuffleCards();
            this.countDown = this.startCountDown();
            this.busy = false; //the cards are now able to be interacted with
        }, 500);
        this.hideCards();
        this.timer.innerText = this.timeRemaining;
        this.ticker.innerText = this.totalClicks;
    }
    hideCards() { //When a new game is started, we need to hide the old game play cards
        this.cardsArray.forEach(card => { //remove any previously given classes
            card.classList.remove('visible');
            card.classList.remove('matched');
        });
    }
    flipCard(card) {
        if(this.canFlipCard(card)) { //If you are still able to click on a card and you click it...
            this.audioController.flip(); //call the flip sound.
            this.totalClicks++; //add to the click total.
            this.ticker.innerText = this.totalClicks; //update the actual ticker to reflect the addition
            card.classList.add('visible'); //give the card a visible class, flipping it over.

            if(this.cardToCheck) //if the cardToCheck is not null, we're checking it for the first time...
                this.checkForCardMatch(card); //call the checkForCardMatch function
            else
                this.cardToCheck = card; //If it is null, let the card clicked become the current cardToCheck
        }
    }
    checkForCardMatch(card) {
        if(this.getCardType(card) === this.getCardType(this.cardToCheck)) //if this card they clicked is equal to the next card clicked..
            this.cardMatch(card, this.cardToCheck); //Call the cardMatch() function passing the two matched cards
        else
            this.cardMisMatch(card, this.cardToCheck); //Or call the cardMisMatch() with those values

        this.cardToCheck = null;
    }
    cardMatch(card1, card2) {
        this.matchedCards.push(card1); //add the cards to the matchedCards array.
        this.matchedCards.push(card2);
        card1.classList.add('matched');
        card2.classList.add('matched');
        this.audioController.match();
        if(this.matchedCards.length === this.cardsArray.length) //check to see if the total matched = the total cards
            this.victory();
    }
    cardMisMatch(card1, card2) {
        this.busy = true; //they're active, can't interact
        setTimeout(() => { //give the user 1 second to view them flipped over
            card1.classList.remove('visible'); //flip it back over
            card2.classList.remove('visible');
            this.busy = false; //they become
        }, 1000);
    }
    getCardType(card) {
        return card.getElementsByClassName('card-value')[0].src; //returns the image src
    }
    startCountDown() { //calls the function inside of it every second
        return setInterval(() => {
            this.timeRemaining--;
            this.timer.innerText = this.timeRemaining;
            if(this.timeRemaining === 0)
                this.gameOver();
        }, 1000);
    }
    gameOver() {
        let overlay = document.getElementById('game-over-screen');
        let restart = document.getElementsByClassName('overlay-text-small')[0];
        clearInterval(this.countDown); //stops the timer
        this.audioController.gameOver(); //play the gameover sound
        overlay.classList.add('visible'); //add the gameover screen
        restart.addEventListener('click', () => {
          overlay.classList.remove('visible'); //remove the overlay when they click restart
          newGame(); // call the newGame() to play again
        });
    }
    victory() {
      let overlay = document.getElementById('victory-screen');
      let restart = document.getElementsByClassName('overlay-text-small')[1];
      clearInterval(this.countDown);
      this.audioController.victory();
      overlay.classList.add('visible');
      restart.addEventListener('click', () => {
        overlay.classList.remove('visible');
        newGame();
      });
    }

    shuffleCards() { //Fisher Yates Suffle
        for(let i = this.cardsArray.length - 1; i > 0; i--) { //Loops through backwards, removes last character, replaces with random one
            let randIndex = Math.floor(Math.random() * (i+1));
            this.cardsArray[randIndex].style.order = i; //the order property can be used with the grid we set up in CSS
            this.cardsArray[i].style.order = randIndex; //takes the random item in cards list, takes the card we're on in the cards list, swap the order in the css grid.
        }
    }

    canFlipCard(card) { //Tells you if the card is in the middle of an animation or if its already been clicked on
        return !this.busy && !this.matchedCards.includes(card) && card !== this.cardToCheck; //if all three are false, then it returns true
    }
}

//WHEN THE PAGE LOADS, CREATE A NEW GAME INSTANCE WITH THESE PARAMETERS
async function ready() {
    await fetchPokemon(); //wait until fetchPokemon() is done

    console.log('all body elements', document.querySelectorAll('card')); //log these to keep track
    let overlay = document.getElementById('initial-game-screen');
    let cards = Array.from(document.getElementsByClassName('card'));
    let game = new PokemonMatch(60, cards); //create a new game instance, set the timer to 60, pass it the cards as a parameter

    overlay.addEventListener('click', () => { //Give click functionality to overlay
      overlay.classList.remove('visible'); //Make it go away
      game.startGame(); //start the game when this happens
    });

    console.log('cards = ', cards); //log the cards to make sure they're being created

    cards.forEach(card => { //We turned them into an Array so we could use the forEach() function
      console.log('working'); //make sure they are working 16 times.
        card.addEventListener('click', () => {
            game.flipCard(card); //passes the card to the flip function, calls flipCard() when clicked
        });
    });
}

async function newGame() { //make the new game wait for the pokemon cards to be created
    await fetchPokemon(); //once the pokemon are fetched and the cards created, run the rest.

    let overlay = document.getElementById('initial-game-screen');
    let cards = Array.from(document.getElementsByClassName('card'));
    let game = new PokemonMatch(60, cards);

    game.startGame(); //call the start game function

    console.log('cards = ', cards); //make sure new cards are working

    cards.forEach(card => { //make them clickable, pass each one the ability to check for flipCard()
      console.log('working');
        card.addEventListener('click', () => {
            game.flipCard(card);
        });
    });
}

window.addEventListener('load', function () { //Wait until the page loads...
  loadingScreen.className += " loaderHidden"; //then remove the loading loading
  ready(); //call the readt function. 
});

// if(document.readyState === 'loading') { //If the page hasn't loaded yet...
//     document.addEventListener('load', function(){ // Wait until it loads and then remove the loading screen
//       loadingScreen.classList.add('loaderHidden');
//     },
//     ready()); //then call the ready() function.
// } else {
//     loadingScreen.classList.add('loaderHidden');
//     ready(); //If it's already ready, call ready()
// }
