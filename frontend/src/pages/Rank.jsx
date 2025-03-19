import { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import rank1 from "../assets/rank1.png";
import rank2 from "../assets/rank2.png";
import rank3 from "../assets/rank3.png";
import rank4 from "../assets/rank4.png";
import rank5 from "../assets/rank5.png";

export default function Hangman() {
  const [wordData, setWordData] = useState({ word: "", hint: "" });
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameStatus, setGameStatus] = useState("");
  const maxWrong = 6;
  const [user, setUser] = useState(null);
  const [canPlay, setCanPlay] = useState(false);
  const [nextPlayDate, setNextPlayDate] = useState(null);
  const [loading, setLoading] = useState(true);

  const wrongGuessAnimation = useAnimation();

  useEffect(() => {
    const fetchDailyChallenge = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_URL_LOCAL}/api/rank/daily-challenge`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Chyba při získání denní výzvy");
        }

        const data = await response.json();
        setCanPlay(data.canPlay);
        setNextPlayDate(data.nextPlayDate);

        if (data.canPlay && data.wordData) {
          setWordData(data.wordData);
        }
      } catch (error) {
        console.error("Chyba při získání denní výzvy:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserProfile = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL_LOCAL}/api/rank/profile`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Chyba při načítání profilu");
        }

        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error("Chyba při načítání profilu:", error);
      }
    };

    fetchDailyChallenge();
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (wrongGuesses > 0) {
      wrongGuessAnimation.start({
        opacity: [1, 0, 1],
        x: [0, 10, -10, 0],
        transition: { duration: 0.5 },
      });
    }
  }, [wrongGuesses, wrongGuessAnimation]);

  const handleGuess = (letter) => {
    if (guessedLetters.includes(letter) || gameStatus) return;
    setGuessedLetters([...guessedLetters, letter]);

    if (!wordData.word.includes(letter)) {
      setWrongGuesses(wrongGuesses + 1);
    }
  };

  const maskedWord = wordData.word
    ? wordData.word
        .split("")
        .map((letter) => (guessedLetters.includes(letter) ? letter : "_"))
        .join(" ")
    : "";

  const isGameOver = wrongGuesses >= maxWrong;
  const isWinner = wordData.word && !maskedWord.includes("_");

  useEffect(() => {
    if (isGameOver) {
      setGameStatus(`Game Over! The word was: ${wordData.word}`);
      recordLoss();
    } else if (isWinner) {
      setGameStatus("Vyhrál si! 🎉");
      addPoints();
    }
  }, [isGameOver, isWinner, wordData.word]);

  const recordLoss = async () => {
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/rank/record-loss`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setCanPlay(false);
    } catch (error) {
      console.error("Chyba při záznamu prohry:", error);
    }
  };

  const addPoints = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/rank/add-points`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Chyba při přidání bodů");
      }

      const data = await response.json();
      console.log("Body přidány:", data);
      alert(`Získal jsi 5 bodů!`);
      setCanPlay(false);

      const profileResponse = await fetch(
        `${import.meta.env.VITE_API_URL_LOCAL}/api/rank/profile`,
        { credentials: "include" }
      );

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUser(profileData);
      }
    } catch (error) {
      console.error("Chyba při přidávání bodů:", error);
    }
  };

  const rankImages = {
    1: rank1,
    2: rank2,
    3: rank3,
    4: rank4,
    5: rank5,
  };

  const formatTimeToNextGame = () => {
    if (!nextPlayDate) return "";

    const now = new Date();
    const next = new Date(nextPlayDate);
    const diffMs = next - now;

    if (diffMs <= 0) return "Nová výzva je k dispozici!";

    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `Další výzva za: ${diffHrs}h ${diffMins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Načítání denní výzvy...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white via-gray-50 to-[#f8e5e5] p-4 sm:p-6 md:p-8">
      <motion.h1
        className="text-3xl sm:text-4xl font-bold mb-10 bg-gradient-to-r from-[#800020] to-[#aa0030] bg-clip-text text-transparent"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Denní výzva Hangman
      </motion.h1>

      {user && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-5 mb-8 bg-white p-5 rounded-xl shadow-md border border-[#800020]/20 w-full max-w-md relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#800020] to-[#aa0030]"></div>

          <div className="relative group">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#5a0014]/30 to-[#800020]/30 opacity-0 group-hover:opacity-100 transition-all duration-300 blur-sm scale-110"></div>
            <div className="relative z-10 p-1 rounded-full bg-gradient-to-tr from-[#800020]/10 to-[#aa0030]/10">
              <img
                src={rankImages[user.rank]}
                alt={`Rank ${user.rank}`}
                className="w-16 h-16 object-contain p-1 transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-bold text-[#800020]">
              {user.username}
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-gray-700 mt-1">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-[#800020] mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span className="font-medium">Level {user.rank}</span>
              </div>
              <div className="hidden sm:block text-[#aa0030]">•</div>
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-[#800020] mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">{user.points} bodů</span>
              </div>
            </div>

            <div className="w-full mt-2">
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#800020] to-[#aa0030] rounded-full"
                  style={{ width: `${Math.min(100, user.points % 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {user.points % 100}/100 do dalšího levelu
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {!canPlay && !gameStatus && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border-l-4 border-[#800020] p-6 mb-8 w-full max-w-md rounded-lg shadow-md"
        >
          <div className="flex items-start">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-[#800020] mr-3 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-lg font-semibold text-gray-800">
                Dnešní výzvu jsi již absolvoval
              </p>
              <p className="text-gray-600 mt-2">{formatTimeToNextGame()}</p>
            </div>
          </div>
        </motion.div>
      )}

      {canPlay && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center w-full max-w-2xl"
        >
          <div className="bg-white px-6 py-4 rounded-lg shadow-md border border-[#800020]/10 mb-6 w-full text-center">
            <h2 className="text-xl font-semibold text-[#800020]">
              {wordData.hint}
            </h2>
          </div>

          <div className="bg-white py-6 px-8 rounded-xl shadow-md border border-[#800020]/10 mb-8 w-full text-center">
            <div className="flex justify-center space-x-2 sm:space-x-3">
              {maskedWord.split(" ").map((char, index) => (
                <div
                  key={index}
                  className={`w-8 h-12 sm:w-10 sm:h-14 flex items-center justify-center border-b-2 ${
                    char !== "_" ? "border-[#800020]" : "border-gray-300"
                  } text-3xl sm:text-4xl font-mono font-bold ${
                    char !== "_" ? "text-[#800020]" : "text-transparent"
                  }`}
                >
                  {char !== "_" ? char : "."}
                </div>
              ))}
            </div>
          </div>

          <motion.div
            animate={wrongGuessAnimation}
            className="mb-8 bg-white px-5 py-3 rounded-full shadow-sm border border-[#800020]/10"
          >
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 font-medium">Špatné pokusy:</span>
              <div className="flex space-x-1">
                {[...Array(maxWrong)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < wrongGuesses ? "bg-[#800020]" : "bg-gray-200"
                    }`}
                  ></div>
                ))}
              </div>
              <span className="text-sm font-medium text-gray-500">
                {wrongGuesses}/{maxWrong}
              </span>
            </div>
          </motion.div>

          <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 w-full max-w-xl bg-white p-5 rounded-xl shadow-md border border-[#800020]/10">
            {"abcdefghijklmnopqrstuvwxyz0123456789".split("").map((letter) => (
              <motion.button
                key={letter}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleGuess(letter)}
                disabled={guessedLetters.includes(letter) || gameStatus}
                className={`
              p-2 sm:p-3 rounded-lg font-bold text-sm sm:text-base transition-all duration-200
              ${
                guessedLetters.includes(letter)
                  ? wordData.word.includes(letter)
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-gray-100 text-gray-400 border border-gray-200"
                  : "bg-gradient-to-br from-[#800020] to-[#aa0030] text-white hover:shadow-md active:shadow-inner"
              }
              disabled:cursor-not-allowed
            `}
              >
                {letter.toUpperCase()}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {gameStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-8 p-6 rounded-lg shadow-md w-full max-w-md ${
            isWinner
              ? "bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500"
              : "bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-[#800020]"
          }`}
        >
          <div className="flex items-center">
            {isWinner ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-green-500 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-[#800020] mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            <div>
              <h3
                className={`text-xl font-bold ${
                  isWinner ? "text-green-700" : "text-[#800020]"
                }`}
              >
                {isWinner
                  ? "Výborně! Uhádl jsi slovo."
                  : "Bohužel, neuhádl jsi slovo."}
              </h3>
              <p className="text-gray-600 mt-1">
                {isWinner
                  ? "Získal jsi 5 bodů za správné řešení!"
                  : `Hledané slovo bylo: ${wordData.word}`}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
