/*jshint esversion: 6 */

const gameContainer = document.getElementById('game-container');

// GET THE POKEMON DATA FROM THE POKEAPI
const fetchPokemon = () => {
  const promises = [];
  for (let i = 1; i < 17; i++) {
    const url = `https://pokeapi.co/api/v2/pokemon/${i}`;
      promises.push(fetch(url)
        .then(response => response.json()));
    }

    Promise.all(promises).then( results => {
      const pokemon = results.map((data) => ({
        name: data.name,
        id: data.id,
        image: data.sprites.front_default
      }));
      generatePokemonCards(pokemon);
    });
  };

// CREATE CARDS USING THE DATA RECEIVED
const generatePokemonCards = (pokemon) => {
  console.log(pokemon);
  const pokemonHTMLString = pokemon.map( pokeman => `
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
    gameContainer.innerHTML = pokemonHTMLString;
};

fetchPokemon();

//CONTROL THE AUDIO ELEMENTS
class AudioController {
    constructor() {
        this.bgMusic = document.getElementById('pokemon-theme');
        this.flipSound = document.getElementById('flip-sound');
        this.matchSound = document.getElementById('match-sound');
        this.victorySound = document.getElementById('victory-sound');
        this.gameOverSound = document.getElementById('gameover-sound');
        this.bgMusic.volume = 0.5;
        this.bgMusic.loop = true;
    }
    startMusic() {
        this.bgMusic.play();
    }
    stopMusic() {
        this.bgMusic.pause();
        this.bgMusic.currentTime = 0;
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
        this.cardsArray = cards;
        this.totalTime = totalTime;
        this.timeRemaining = totalTime;
        this.timer = document.getElementById('time-remaining');
        this.ticker = document.getElementById('flips');
        this.audioController = new AudioController();
    }
    startGame() {
        this.cardToCheck = null;
        this.totalClicks = 0;
        this.timeRemaining = this.totalTime;
        this.matchedCards = [];
        this.busy = true;
        setTimeout(() => {
            this.audioController.startMusic();
            this.shuffleCards();
            this.countDown = this.startCountDown();
            this.busy = false;
        }, 500);
        this.hideCards();
        this.timer.innerText = this.timeRemaining;
        this.ticker.innerText = this.totalClicks;
    }
    hideCards() {
        this.cardsArray.forEach(card => {
            card.classList.remove('visible');
            card.classList.remove('matched');
        });
    }
    flipCard(card) {
        if(this.canFlipCard(card)) {
            this.audioController.flip();
            this.totalClicks++;
            this.ticker.innerText = this.totalClicks;
            card.classList.add('visible');

            if(this.cardToCheck)
                this.checkForCardMatch(card);
            else
                this.cardToCheck = card;
        }
    }
    checkForCardMatch(card) {
        if(this.getCardType(card) === this.getCardType(this.cardToCheck))
            this.cardMatch(card, this.cardToCheck);
        else
            this.cardMisMatch(card, this.cardToCheck);

        this.cardToCheck = null;
    }
    cardMatch(card1, card2) {
        this.matchedCards.push(card1);
        this.matchedCards.push(card2);
        card1.classList.add('matched');
        card2.classList.add('matched');
        this.audioController.match();
        if(this.matchedCards.length === this.cardsArray.length)
            this.victory();
    }
    cardMisMatch(card1, card2) {
        this.busy = true;
        setTimeout(() => {
            card1.classList.remove('visible');
            card2.classList.remove('visible');
            this.busy = false;
        }, 1000);
    }
    getCardType(card) {
        return card.getElementsByClassName('card-value')[0].src;
    }
    startCountDown() {
        return setInterval(() => {
            this.timeRemaining--;
            this.timer.innerText = this.timeRemaining;
            if(this.timeRemaining === 0)
                this.gameOver();
        }, 1000);
    }
    gameOver() {
        clearInterval(this.countDown);
        this.audioController.gameOver();
        document.getElementById('game-over-text').classList.add('visible');
    }
    victory() {
        clearInterval(this.countDown);
        this.audioController.victory();
        document.getElementById('victory-text').classList.add('visible');
    }

    shuffleCards() {
        for(let i = this.cardsArray.length - 1; i > 0; i--) {
            let randIndex = Math.floor(Math.random() * (i+1));
            this.cardsArray[randIndex].style.order = i;
            this.cardsArray[i].style.order = randIndex;
        }
    }

    canFlipCard(card) {
        return !this.busy && !this.matchedCards.includes(card) && card !== this.cardToCheck;
    }
}

//WHEN THE PAGE LOADS, CREATE A NEW GAME INSTANCE WITH THESE PARAMETERS
function ready() {
    let overlays = Array.from(document.getElementsByClassName('overlay-text'));
    let cards = Array.from(document.getElementsByClassName('card'));
    let game = new PokemonMatch(80, cards);

    overlays.forEach(overlay => {
        overlay.addEventListener('click', () => {
            overlay.classList.remove('visible');
            game.startGame();
        });
    });
    cards.forEach(card => {
        card.addEventListener('click', () => {
            game.flipCard(card);
        });
    });
}

if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready());
} else {
    ready();

}
