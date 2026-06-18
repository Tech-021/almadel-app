import { useCallback, useEffect } from "react";
import { Vibration } from "react-native";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";

const scanSound = require("../assets/sound/scanner-beep.mp3");

export function useScanFeedback() {
  const scanPlayer = useAudioPlayer(scanSound);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
    }).catch((error) => {
      console.log("Audio mode error:", error);
    });
  }, []);

  const playScanFeedback = useCallback(() => {
    try {
      scanPlayer.seekTo(0);
      scanPlayer.play();
      Vibration.vibrate(50);
    } catch (error) {
      console.log("Scan feedback error:", error);
    }
  }, [scanPlayer]);

  return {
    playScanFeedback,
  };
}
