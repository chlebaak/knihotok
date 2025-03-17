import { useState, useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

const wordList = [
  { word: "1984", hint: "Dystopický román George Orwella." },
  { word: "tolkien", hint: "Autor Pána prstenů." },
  { word: "dune", hint: "Sci-fi klasika Franka Herberta." },
  { word: "gatsby", hint: "Slavný román o americkém snu." },
  { word: "twilight", hint: "Upíří romantika pro teenagery." },
  { word: "sherlock", hint: "Nejznámější detektiv všech dob." },
  { word: "dracula", hint: "Klasický horor od Brama Stokera." },
  { word: "hamlet", hint: "Tragédie od Williama Shakespeara." },
  { word: "potter", hint: "Čaroděj s jizvou na čele." },
  { word: "verne", hint: "Francouzský autor sci-fi románů." }
];

const getRandomWord = () => wordList[Math.floor(Math.random() * wordList.length)];

export default function Hangman() {
  const [{ word, hint }, setWordData] = useState(getRandomWord);
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameStatus, setGameStatus] = useState("");
  const maxWrong = 6;

  const wrongGuessAnimation = useAnimation();

  useEffect(() => {
    if (wrongGuesses > 0) {
      wrongGuessAnimation.start({
        opacity: [1, 0, 1],
        x: [0, 10, -10, 0],
        transition: { duration: 0.5 }
      });
    }
  }, [wrongGuesses, wrongGuessAnimation]);

  const handleGuess = (letter) => {
    if (guessedLetters.includes(letter) || gameStatus) return;
    setGuessedLetters([...guessedLetters, letter]);

    if (!word.includes(letter)) {
      setWrongGuesses(wrongGuesses + 1);
    }
  };

  const maskedWord = word
    .split("")
    .map((letter) => (guessedLetters.includes(letter) ? letter : "_"))
    .join(" ");

  const isGameOver = wrongGuesses >= maxWrong;
  const isWinner = !maskedWord.includes("_");

  useEffect(() => {
    if (isGameOver) {
      setGameStatus(`Game Over! The word was: ${word}`);
    } else if (isWinner) {
      setGameStatus("You Win! 🎉");
    }
  }, [isGameOver, isWinner, word]);

  const resetGame = () => {
    setWordData(getRandomWord());
    setGuessedLetters([]);
    setWrongGuesses(0);
    setGameStatus("");
  };

  const addPoints = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL_LOCAL}/api/rank/add-points`, {
      method: "POST",
      credentials: "include", // Nutné pro cookies
      headers: {
        "Content-Type": "application/json",
      },
      });
  
      const data = await response.json();
      if (response.ok) {
        console.log("Body přidány:", data);
        alert(`Získal jsi 5 bodů!`);
      } else {
        console.error("Chyba při přidávání bodů:", data.error);
      }
    } catch (error) {
      console.error("Chyba připojení:", error);
    }
  };
  
  // Přidání bodů po výhře
  useEffect(() => {
    if (isWinner) {
      setGameStatus("You Win! 🎉");
      addPoints();
    }
  }, [isWinner]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
      <h2 className="text-lg sm:text-xl font-semibold mb-2 text-gray-600">{hint}</h2>
      <motion.h1
        className="text-4xl font-bold mb-6 text-red-800"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        Hangman
      </motion.h1>
      <div className="text-3xl font-mono mb-6">{maskedWord}</div>
      <div className="mb-4">Wrong guesses: {wrongGuesses}/{maxWrong}</div>
      <div className="grid grid-cols-9 gap-2">
        {"abcdefghijklmnopqrstuvwxyz0123456789".split("").map((letter) => (
          <button
            key={letter}
            onClick={() => handleGuess(letter)}
            disabled={guessedLetters.includes(letter) || gameStatus}
            className={`p-2 rounded-lg font-semibold transition-all duration-300 
              ${guessedLetters.includes(letter) ? "bg-gray-300" : "bg-red-500 text-white hover:bg-red-600"}
            `}
          >
            {letter.toUpperCase()}
          </button>
        ))}
      </div>
      {gameStatus && (
        <div className="mt-6 font-bold text-xl text-red-800">{gameStatus}</div>
      )}
      {(isGameOver || isWinner) && (
        <button onClick={resetGame} className="mt-4 p-3 bg-blue-500 text-white rounded-lg">
          Play Again
        </button>
      )}
    </div>
  );
}
